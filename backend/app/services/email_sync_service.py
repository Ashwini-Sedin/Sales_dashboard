import asyncio
from datetime import datetime
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy.dialects.postgresql import insert

from app.models.lead import Lead
from app.models.user import User
from app.models.email_message import EmailMessage
from app.services.graph_client import graph_client
from app.core.database import SessionLocal

async def sync_emails_for_lead(db: Session, lead_id: UUID):
    """
    Fetches emails from Graph API for a specific lead and upserts them into the database.
    """
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead or not lead.email:
        return

    owner = db.query(User).filter(User.id == lead.owner_id).first() if lead.owner_id else None
    
    # We need a mailbox to query. We use the lead owner's email.
    # If no owner or owner lacks email, we cannot query.
    if not owner or not owner.email:
        return
        
    mailbox = owner.email
    lead_email = lead.email

    # Graph API filter: messages where sender is lead, OR lead is in toRecipients
    # $filter doesn't easily support any() for toRecipients on the base messages endpoint without advanced queries,
    # but let's build the filter string.
    # A safe fallback that is supported by Graph API is searching or using advanced query.
    # Alternatively: $filter=(from/emailAddress/address eq '{lead_email}')
    # For robust matching, we use $search or $filter. Let's use $filter as requested.
    filter_query = f"(from/emailAddress/address eq '{lead_email}')"

    endpoint = f"/users/{mailbox}/messages?$filter={filter_query}&$select=id,subject,from,toRecipients,bodyPreview,body,receivedDateTime,hasAttachments"
    
    messages = []
    
    while endpoint:
        # graph_client is async
        response_data = await graph_client.get(endpoint)
        if not response_data:
            break
            
        page_messages = response_data.get("value", [])
        messages.extend(page_messages)
        
        # Pagination
        endpoint = response_data.get("@odata.nextLink")
        if endpoint:
            # nextLink is usually a full URL, we need to extract the relative path or graph_client needs to handle full URLs.
            # httpx handles full URLs fine if we pass them, but our graph_client prefixes with base_url if it starts with '/'.
            # Let's ensure we pass the correct format.
            if endpoint.startswith("https://graph.microsoft.com/v1.0"):
                endpoint = endpoint.replace("https://graph.microsoft.com/v1.0", "")
            
    if not messages:
        return

    # Upsert into database
    for msg in messages:
        sender_info = msg.get("from", {}).get("emailAddress", {})
        sender_email = sender_info.get("address")
        sender_name = sender_info.get("name")
        
        recipients = []
        for r in msg.get("toRecipients", []):
            addr = r.get("emailAddress", {})
            recipients.append({"name": addr.get("name"), "email": addr.get("address")})
            
        received_at_str = msg.get("receivedDateTime")
        received_at = datetime.fromisoformat(received_at_str.replace("Z", "+00:00")) if received_at_str else None
        
        is_outgoing = (sender_email == mailbox)

        stmt = insert(EmailMessage).values(
            lead_id=lead.id,
            message_id=msg["id"],
            subject=msg.get("subject"),
            sender_email=sender_email,
            sender_name=sender_name,
            recipients=recipients,
            body_html=msg.get("body", {}).get("content"),
            body_preview=msg.get("bodyPreview"),
            received_at=received_at,
            has_attachments=msg.get("hasAttachments", False),
            is_outgoing=is_outgoing,
            raw_metadata=msg
        )
        
        # ON CONFLICT DO UPDATE
        stmt = stmt.on_conflict_do_update(
            index_elements=['message_id'],
            set_={
                'subject': stmt.excluded.subject,
                'recipients': stmt.excluded.recipients,
                'body_html': stmt.excluded.body_html,
                'body_preview': stmt.excluded.body_preview,
                'has_attachments': stmt.excluded.has_attachments,
                'raw_metadata': stmt.excluded.raw_metadata,
            }
        )
        
        db.execute(stmt)
    
    db.commit()


async def process_graph_webhook(db: Session, notification_data: dict):
    """
    Parse Graph change notification, find matching lead, enqueue sync task.
    """
    # notification_data structure:
    # {"value": [{"resource": "Users/xxx/Messages/yyy", "resourceData": {"@odata.id": "...", "id": "..."}, ...}]}
    
    from app.tasks.email_tasks import sync_lead_emails
    
    values = notification_data.get("value", [])
    for value in values:
        resource = value.get("resource")
        if not resource:
            continue
            
        # Optional: We could fetch the exact message to see who it's from/to
        # But if the webhook is subscribed per user mailbox, we can just trigger a sync for leads owned by that user.
        # Alternatively, fetch the message to extract sender email, then lookup lead by email.
        resource_id = value.get("resourceData", {}).get("id")
        if not resource_id:
            continue
            
        try:
            # The resource URL can be fetched directly using Graph Client
            # The resource in the payload looks like "Users/user-id/Messages/message-id"
            endpoint = f"/{resource}" if not resource.startswith("/") else resource
            msg = await graph_client.get(endpoint)
            if not msg:
                continue
                
            # Extract emails
            emails_to_check = []
            
            sender = msg.get("from", {}).get("emailAddress", {}).get("address")
            if sender:
                emails_to_check.append(sender)
                
            for r in msg.get("toRecipients", []):
                recipient = r.get("emailAddress", {}).get("address")
                if recipient:
                    emails_to_check.append(recipient)
            
            if not emails_to_check:
                continue
                
            # Find matching leads
            leads = db.query(Lead).filter(Lead.email.in_(emails_to_check)).all()
            for lead in leads:
                # Enqueue sync task
                sync_lead_emails.delay(str(lead.id))
                
        except Exception as e:
            print(f"Error processing webhook for resource {resource}: {e}")
