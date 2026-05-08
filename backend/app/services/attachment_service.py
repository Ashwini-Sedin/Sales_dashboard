from datetime import datetime, timezone
import uuid
from typing import Dict, Any
from sqlalchemy.orm import Session
from app.services.graph_client import graph_client
from app.services.s3_service import s3_service
from app.models.email import EmailAttachment, StorageType

class AttachmentService:
    async def download_attachment(self, mailbox: str, message_id: str, attachment_id: str) -> bytes:
        """
        Fetches attachment bytes from Graph API:
        /v1.0/users/{user_id}/messages/{id}/attachments/{att_id}/$value
        """
        endpoint = f"/users/{mailbox}/messages/{message_id}/attachments/{attachment_id}/$value"
        # Since /$value returns raw binary, graph_client's default .json() parsing will fail
        # if it forces response.json(). Let's check how graph_client is implemented.
        # Our graph_client uses response.json() by default, unless it's 204.
        # Let's write a direct httpx call or get the raw client from graph_client.
        # Actually, let's write a helper or use graph_client's client directly or fetch the token.
        from app.services.graph_auth_service import graph_auth_service
        import httpx
        
        token = await graph_auth_service.get_access_token()
        headers = {
            "Authorization": f"Bearer {token}"
        }
        
        async with httpx.AsyncClient() as client:
            url = f"https://graph.microsoft.com/v1.0/users/{mailbox}/messages/{message_id}/attachments/{attachment_id}/$value"
            response = await client.get(url, headers=headers)
            response.raise_for_status()
            return response.content

    def store_attachment(
        self, db: Session, lead_id: uuid.UUID, email_id: uuid.UUID, att_metadata: Dict[str, Any], content_bytes: bytes
    ) -> EmailAttachment:
        """
        If size < 4MB upload to S3; else save reference only. Save record to email_attachments.
        """
        filename = att_metadata.get("name", "attachment")
        content_type = att_metadata.get("contentType", "application/octet-stream")
        size_bytes = len(content_bytes) if content_bytes else att_metadata.get("size", 0)
        attachment_id = att_metadata.get("id")

        storage_type = StorageType.inline
        storage_key = None

        # "if size < 4MB upload to S3 via boto3; else save reference only"
        four_mb = 4 * 1024 * 1024
        if size_bytes < four_mb and content_bytes:
            # Upload to S3
            s3_key = f"attachments/{lead_id}/{email_id}/{uuid.uuid4()}_{filename}"
            storage_key = s3_service.upload_file(s3_key, content_bytes, content_type)
            storage_type = StorageType.s3

        attachment = EmailAttachment(
            email_message_id=email_id,
            lead_id=lead_id,
            attachment_id=attachment_id,
            filename=filename,
            content_type=content_type,
            size_bytes=size_bytes,
            storage_type=storage_type,
            storage_key=storage_key,
            downloaded_at=datetime.now(timezone.utc) if content_bytes else None
        )
        
        db.add(attachment)
        db.commit()
        db.refresh(attachment)
        return attachment

attachment_service = AttachmentService()
