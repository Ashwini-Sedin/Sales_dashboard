from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Query, Request, Response, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.core.database import get_db
from app.core.dependencies import get_current_active_user, require_roles
from app.models.user import User, UserRole
from app.models.email import EmailMessage, EmailAttachment, StorageType
from app.schemas.email import EmailMessageResponse, EmailMessageDetail, EmailAttachmentResponse
from app.services.email_sync_service import process_graph_webhook
from app.services.s3_service import s3_service
from app.services.attachment_service import attachment_service
from app.tasks.email_tasks import sync_lead_emails

router = APIRouter(tags=["emails"])

@router.post("/api/integrations/graph/email-webhook")
async def graph_email_webhook(request: Request, db: Session = Depends(get_db)):
    """
    Webhook endpoint for Microsoft Graph change notifications.
    Handles the validationToken challenge and processes incoming notifications.
    """
    # Handle Microsoft Graph validation challenge
    validation_token = request.query_params.get("validationToken")
    if validation_token:
        # Must return the exact plain text validationToken and a 200 OK status
        return Response(content=validation_token, media_type="text/plain", status_code=200)

    try:
        payload = await request.json()
        # The payload contains {"value": [{...}]} representing notifications
        if payload and "value" in payload:
            # Enqueue webhook processing via the async service
            await process_graph_webhook(db, payload)
            
        return {"status": "success"}
    except Exception as e:
        print(f"Error handling Graph webhook: {e}")
        # Graph API expects 202 Accepted for valid notifications even if processing fails
        return Response(status_code=202)

@router.get("/api/leads/{lead_id}/emails", response_model=dict)
def get_lead_emails(
    lead_id: UUID,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Fetch a paginated list of synced emails for a specific lead.
    """
    query = db.query(EmailMessage).filter(EmailMessage.lead_id == lead_id)
    
    total = query.count()
    emails = query.order_by(desc(EmailMessage.received_at)).offset((page - 1) * limit).limit(limit).all()
    
    response_items = [EmailMessageResponse.model_validate(email) for email in emails]
    
    return {
        "items": response_items,
        "total": total,
        "page": page,
        "size": limit,
        "pages": (total + limit - 1) // limit
    }

@router.get("/api/leads/{lead_id}/emails/{message_id}", response_model=EmailMessageDetail)
def get_lead_email_detail(
    lead_id: UUID,
    message_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Fetch a full email including body_html and raw_metadata.
    """
    email = db.query(EmailMessage).filter(
        EmailMessage.lead_id == lead_id,
        EmailMessage.message_id == message_id
    ).first()
    
    if not email:
        raise HTTPException(status_code=404, detail="Email not found")
        
    return email

@router.get("/api/leads/{lead_id}/emails/{message_id}/attachments", response_model=List[EmailAttachmentResponse])
def get_email_attachments(
    lead_id: UUID,
    message_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    List attachments for a specific email message.
    """
    email = db.query(EmailMessage).filter(
        EmailMessage.lead_id == lead_id,
        EmailMessage.message_id == message_id
    ).first()
    
    if not email:
        raise HTTPException(status_code=404, detail="Email not found")
        
    attachments = db.query(EmailAttachment).filter(EmailAttachment.email_message_id == email.id).all()
    return attachments

@router.get("/api/leads/{lead_id}/emails/{message_id}/attachments/{att_id}/download")
async def download_email_attachment(
    lead_id: UUID,
    message_id: str,
    att_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Generates S3 pre-signed URL and returns 302 Redirect to the S3 URL.
    """
    email = db.query(EmailMessage).filter(
        EmailMessage.lead_id == lead_id,
        EmailMessage.message_id == message_id
    ).first()
    
    if not email:
        raise HTTPException(status_code=404, detail="Email not found")
        
    attachment = db.query(EmailAttachment).filter(
        EmailAttachment.email_message_id == email.id,
        EmailAttachment.attachment_id == att_id
    ).first()
    
    if not attachment:
        # If the attachment record doesn't exist in our DB, we can try to find it dynamically in raw_metadata
        # and store it, or raise 404. Let's raise 404 for safety or lazy load it.
        raise HTTPException(status_code=404, detail="Attachment not found")
        
    if attachment.storage_type == StorageType.s3 and attachment.storage_key:
        url = s3_service.get_presigned_url(attachment.storage_key)
        return Response(headers={"Location": url}, status_code=302)
    else:
        # If stored inline or not yet downloaded, lazily download from MS Graph and upload to S3 now!
        from app.models.user import User
        owner = db.query(User).filter(User.id == email.lead.owner_id).first() if email.lead.owner_id else None
        if not owner or not owner.email:
            raise HTTPException(status_code=400, detail="Lead owner email not configured; cannot fetch attachment from Microsoft Graph.")
            
        try:
            content_bytes = await attachment_service.download_attachment(
                mailbox=owner.email,
                message_id=message_id,
                attachment_id=att_id
            )
            
            # Re-upload and store properly
            filename = attachment.filename
            s3_key = f"attachments/{lead_id}/{email.id}/{uuid.uuid4()}_{filename}"
            storage_key = s3_service.upload_file(s3_key, content_bytes, attachment.content_type)
            
            attachment.storage_type = StorageType.s3
            attachment.storage_key = storage_key
            attachment.downloaded_at = datetime.now(timezone.utc)
            db.commit()
            
            url = s3_service.get_presigned_url(storage_key)
            return Response(headers={"Location": url}, status_code=302)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to fetch attachment from Microsoft Graph: {str(e)}")
