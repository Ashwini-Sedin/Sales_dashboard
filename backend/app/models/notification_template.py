import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base

class NotificationTemplate(Base):
    __tablename__ = "notification_templates"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    event_type = Column(String(100), unique=True)
    subject = Column(String(500))
    body_html = Column(Text)
    is_active = Column(Boolean)
    updated_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    updated_at = Column(DateTime(timezone=True))
