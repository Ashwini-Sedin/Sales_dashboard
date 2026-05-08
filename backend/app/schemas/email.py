from datetime import datetime
from typing import Optional, List, Any
from uuid import UUID
from pydantic import BaseModel, ConfigDict

class Recipient(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None

class EmailMessageBase(BaseModel):
    subject: Optional[str] = None
    sender_email: Optional[str] = None
    sender_name: Optional[str] = None
    recipients: List[Recipient] = []
    body_preview: Optional[str] = None
    received_at: Optional[datetime] = None
    has_attachments: bool = False
    is_outgoing: bool = False

class EmailMessageResponse(EmailMessageBase):
    id: UUID
    message_id: str
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class EmailAttachmentResponse(BaseModel):
    id: UUID
    email_message_id: UUID
    lead_id: UUID
    attachment_id: str
    filename: str
    content_type: Optional[str] = None
    size_bytes: int
    storage_type: str
    downloaded_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class EmailMessageDetail(EmailMessageResponse):
    body_html: Optional[str] = None
    raw_metadata: Optional[Any] = None
    attachments: List[EmailAttachmentResponse] = []
