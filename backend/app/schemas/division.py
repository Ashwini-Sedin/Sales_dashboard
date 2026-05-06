from datetime import datetime
from typing import Optional, Dict, Any
from uuid import UUID
from pydantic import BaseModel, ConfigDict

class DivisionBase(BaseModel):
    name: str
    description: Optional[str] = None
    head_user_id: Optional[UUID] = None
    google_ads_campaign_id: Optional[str] = None
    branding_config: Optional[Dict[str, Any]] = {}

class DivisionCreate(DivisionBase):
    pass

class DivisionUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    head_user_id: Optional[UUID] = None
    google_ads_campaign_id: Optional[str] = None
    branding_config: Optional[Dict[str, Any]] = None

class DivisionResponse(DivisionBase):
    id: UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
