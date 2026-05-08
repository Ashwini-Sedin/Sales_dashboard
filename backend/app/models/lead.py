import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Enum, Text, Numeric, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base

class LeadSource(str, enum.Enum):
    manual = "manual"
    google_ads = "google_ads"
    referral = "referral"
    event = "event"
    other = "other"

class LeadStatus(str, enum.Enum):
    new = "new"
    contacted = "contacted"
    qualified = "qualified"
    proposal_sent = "proposal_sent"
    negotiation = "negotiation"
    won = "won"
    lost = "lost"
    on_hold = "on_hold"

class Lead(Base):
    __tablename__ = "leads"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    first_name = Column(String)
    last_name = Column(String)
    email = Column(String, index=True)
    phone = Column(String)
    company_name = Column(String)
    job_title = Column(String)
    
    source = Column(Enum(LeadSource), default=LeadSource.manual, nullable=False)
    status = Column(Enum(LeadStatus), default=LeadStatus.new, nullable=False)
    
    division_id = Column(UUID(as_uuid=True), ForeignKey("divisions.id"), nullable=False)
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    
    lead_score = Column(Integer, default=0)
    estimated_value = Column(Numeric)
    notes = Column(Text)
    team = Column(JSONB, default=list)
    is_deleted = Column(Boolean, default=False)
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    won_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    division = relationship("Division")
    owner = relationship("User")
