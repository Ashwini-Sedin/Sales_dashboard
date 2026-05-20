from uuid import UUID
from datetime import datetime
from typing import Optional, Any
from pydantic import BaseModel, ConfigDict

class AuditLogBase(BaseModel):
    action: str
    entity_type: str
    entity_id: str
    old_value: Optional[Any] = None
    new_value: Optional[Any] = None
    ip_address: Optional[str] = None

class AuditLogCreate(AuditLogBase):
    user_id: Optional[UUID] = None

class AuditLog(AuditLogBase):
    id: UUID
    user_id: Optional[UUID] = None
    created_at: datetime
    user_email: Optional[str] = None # For display

    model_config = ConfigDict(from_attributes=True)

class AuditLogFilters(BaseModel):
    user_id: Optional[UUID] = None
    action: Optional[str] = None
    entity_type: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
