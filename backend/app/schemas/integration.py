"""
Pydantic schemas for integration tracking.
"""

from datetime import datetime
from typing import Optional, Dict, Any
from uuid import UUID
from pydantic import BaseModel, ConfigDict


class IntegrationSyncBase(BaseModel):
    integration_type: str
    sync_type: str
    status: str
    total_processed: int = 0
    successful: int = 0
    failed: int = 0
    skipped: int = 0
    result_metadata: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None
    last_cursor: Optional[str] = None


class IntegrationSyncCreate(IntegrationSyncBase):
    started_at: datetime


class IntegrationSyncUpdate(BaseModel):
    status: Optional[str] = None
    successful: Optional[int] = None
    failed: Optional[int] = None
    skipped: Optional[int] = None
    result_metadata: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None
    last_cursor: Optional[str] = None
    completed_at: Optional[datetime] = None


class IntegrationSyncResponse(IntegrationSyncBase):
    id: UUID
    started_at: datetime
    completed_at: Optional[datetime] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
