import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB

from app.core.database import Base

class EmailMessage(Base):
    __tablename__ = "email_messages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    lead_id = Column(UUID(as_uuid=True), ForeignKey("leads.id"))
    message_id = Column(String(500), unique=True)
    subject = Column(String(500))
    sender_email = Column(String(255))
    sender_name = Column(String(255))
    recipients = Column(JSONB)
    body_html = Column(Text)
    body_preview = Column(Text)
    received_at = Column(DateTime(timezone=True))
    has_attachments = Column(Boolean)
    is_outgoing = Column(Boolean)
    raw_metadata = Column(JSONB)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
