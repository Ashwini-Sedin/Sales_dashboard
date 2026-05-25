from datetime import datetime
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from decimal import Decimal

from app.models.lead import LeadSource, LeadStatus

class LeadBase(BaseModel):
    first_name: str
    last_name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    company_name: Optional[str] = None
    job_title: Optional[str] = None
    source: LeadSource = LeadSource.manual
    status: LeadStatus = LeadStatus.new
    division_id: UUID
    owner_id: Optional[UUID] = None
    lead_score: int = 0
    estimated_value: Optional[Decimal] = None
    notes: Optional[str] = None
    team: Optional[List[dict]] = None
    linkedin_id: Optional[str] = None
    hq_address: Optional[str] = None
    prospect_address: Optional[str] = None
    website: Optional[str] = None
    employees: Optional[int] = None
    industry: Optional[str] = None
    revenue_usd: Optional[Decimal] = None
    country: Optional[str] = None
    time_zone: Optional[str] = None
    company_info: Optional[str] = None
    current_requirement: Optional[str] = None
    job_url: Optional[str] = None
    other_key_contacts: Optional[List[dict]] = None
    campaign_name: Optional[str] = None
    name_used_for_outreach: Optional[str] = None

class LeadCreate(LeadBase):
    pass

class LeadUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    company_name: Optional[str] = None
    job_title: Optional[str] = None
    source: Optional[LeadSource] = None
    status: Optional[LeadStatus] = None
    owner_id: Optional[UUID] = None
    lead_score: Optional[int] = None
    estimated_value: Optional[Decimal] = None
    notes: Optional[str] = None
    team: Optional[List[dict]] = None
    is_deleted: Optional[bool] = None
    linkedin_id: Optional[str] = None
    hq_address: Optional[str] = None
    prospect_address: Optional[str] = None
    website: Optional[str] = None
    employees: Optional[int] = None
    industry: Optional[str] = None
    revenue_usd: Optional[Decimal] = None
    country: Optional[str] = None
    time_zone: Optional[str] = None
    company_info: Optional[str] = None
    current_requirement: Optional[str] = None
    job_url: Optional[str] = None
    other_key_contacts: Optional[List[dict]] = None
    campaign_name: Optional[str] = None
    name_used_for_outreach: Optional[str] = None

class LeadResponse(LeadBase):
    id: UUID
    is_deleted: bool
    created_at: datetime
    updated_at: datetime
    won_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class LeadListResponse(BaseModel):
    items: List[LeadResponse]
    total: int
    page: int
    size: int

class PipelineStageUpdate(BaseModel):
    stage: LeadStatus
    notes: Optional[str] = None

class LeadFilter(BaseModel):
    division_id: Optional[UUID] = None
    status: Optional[List[LeadStatus]] = None
    source: Optional[LeadSource] = None
    owner_id: Optional[UUID] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    q: Optional[str] = None  # Search query
