import enum
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base

class StorageType(str, enum.Enum):
    s3 = "s3"
    inline = "inline"

class EmailAttachment(Base):
    __tablename__ = "email_attachments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email_message_id = Column(UUID(as_uuid=True), ForeignKey("email_messages.id"))
    lead_id = Column(UUID(as_uuid=True), ForeignKey("leads.id"))
    attachment_id = Column(String(500))
    filename = Column(String(500))
    content_type = Column(String(200))
    size_bytes = Column(Integer)
    storage_type = Column(Enum(StorageType))
    storage_key = Column(String(1000))
    downloaded_at = Column(DateTime(timezone=True))
