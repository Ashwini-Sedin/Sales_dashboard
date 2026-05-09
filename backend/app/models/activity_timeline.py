import enum
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, Enum, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB

from app.core.database import Base

class ActivityEventType(str, enum.Enum):
    lead_created = "lead_created"
    stage_changed = "stage_changed"
    email_sent = "email_sent"
    email_received = "email_received"
    call_recorded = "call_recorded"
    document_generated = "document_generated"
    document_signed = "document_signed"
    note_added = "note_added"
    team_assigned = "team_assigned"

class ActivityTimeline(Base):
    __tablename__ = "activity_timeline"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    lead_id = Column(UUID(as_uuid=True), ForeignKey("leads.id"))
    actor_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    event_type = Column(Enum(ActivityEventType))
    description = Column(Text)
    metadata_ = Column("metadata", JSONB)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
