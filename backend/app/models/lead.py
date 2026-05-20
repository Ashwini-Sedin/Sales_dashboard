import enum
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Enum, Text, Numeric, Integer
from sqlalchemy.dialects.postgresql import UUID, JSONB

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
    first_name = Column(String(100))
    last_name = Column(String(100))
    email = Column(String(255))
    phone = Column(String(50))
    company_name = Column(String(255))
    job_title = Column(String(200))
    linkedin_id = Column(String(255))
    hq_address = Column(Text)
    prospect_address = Column(Text)
    website = Column(String(500))
    employees = Column(Integer)
    industry = Column(String(150))
    revenue_usd = Column(Numeric(18, 2))
    country = Column(String(100))
    time_zone = Column(String(100))
    company_info = Column(Text)
    current_requirement = Column(Text)
    job_url = Column(String(500))
    other_key_contacts = Column(JSONB)
    source = Column(Enum(LeadSource, name="lead_source"))
    status = Column(Enum(LeadStatus, name="lead_status"))
    division_id = Column(UUID(as_uuid=True), ForeignKey("divisions.id"))
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    lead_score = Column(Integer, default=0)
    estimated_value = Column(Numeric(18, 2))
    notes = Column(Text)
    team = Column(JSONB)
    campaign_name = Column(String(255))
    name_used_for_outreach = Column(String(255))
    is_deleted = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    won_at = Column(DateTime(timezone=True), nullable=True)
