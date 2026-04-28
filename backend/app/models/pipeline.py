import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base

class LeadPipelineStage(Base):
    __tablename__ = "lead_pipeline_stages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    lead_id = Column(UUID(as_uuid=True), ForeignKey("leads.id"), nullable=False)
    stage = Column(String, nullable=False)
    changed_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    changed_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    notes = Column(Text)

    # Relationships
    lead = relationship("Lead")
    user = relationship("User")
