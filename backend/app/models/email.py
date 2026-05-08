import uuid
import enum
from datetime import datetime, timezone

from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text, Enum, Integer
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship

from app.core.database import Base

class StorageType(str, enum.Enum):
    s3 = "s3"
    inline = "inline"

class EmailMessage(Base):
    __tablename__ = "email_messages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    lead_id = Column(UUID(as_uuid=True), ForeignKey("leads.id"), nullable=False, index=True)
    message_id = Column(String, unique=True, index=True, nullable=False) # Graph unique ID
    
    subject = Column(String, nullable=True)
    sender_email = Column(String, nullable=True)
    sender_name = Column(String, nullable=True)
    recipients = Column(JSONB, default=list) # JSON list of dicts {"name": "", "email": ""}
    
    body_html = Column(Text, nullable=True)
    body_preview = Column(String, nullable=True)
    
    received_at = Column(DateTime(timezone=True), nullable=True)
    has_attachments = Column(Boolean, default=False)
    is_outgoing = Column(Boolean, default=False)
    
    raw_metadata = Column(JSONB, nullable=True)
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relationships
    lead = relationship("Lead")
    attachments = relationship("EmailAttachment", back_populates="email_message", cascade="all, delete-orphan")

class EmailAttachment(Base):
    __tablename__ = "email_attachments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email_message_id = Column(UUID(as_uuid=True), ForeignKey("email_messages.id"), nullable=False, index=True)
    lead_id = Column(UUID(as_uuid=True), ForeignKey("leads.id"), nullable=False, index=True)
    attachment_id = Column(String, nullable=False, index=True) # Graph attachment ID
    
    filename = Column(String, nullable=False)
    content_type = Column(String, nullable=True)
    size_bytes = Column(Integer, nullable=False, default=0)
    
    storage_type = Column(Enum(StorageType), nullable=False, default=StorageType.inline)
    storage_key = Column(String, nullable=True) # S3 key if stored in S3
    
    downloaded_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relationships
    email_message = relationship("EmailMessage", back_populates="attachments")
    lead = relationship("Lead")
