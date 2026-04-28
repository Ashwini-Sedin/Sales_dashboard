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
    is_deleted: Optional[bool] = None

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
    status: Optional[LeadStatus] = None
    source: Optional[LeadSource] = None
    owner_id: Optional[UUID] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    q: Optional[str] = None  # Search query
