import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base

class LeadTeamMember(Base):
    __tablename__ = "lead_team_members"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    lead_id = Column(UUID(as_uuid=True), ForeignKey("leads.id"))
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    assigned_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    assigned_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))

    __table_args__ = (
        UniqueConstraint('lead_id', 'user_id', name='uq_lead_team_member'),
    )
