from datetime import datetime
from uuid import UUID
from typing import Optional, List

from pydantic import BaseModel, ConfigDict

class DocumentTemplateResponse(BaseModel):
    id: UUID
    division_id: Optional[UUID]
    doc_type: str
    format: str
    template_name: str
    s3_key: str
    thumbnail_s3_key: Optional[str]
    is_active: bool
    created_by: UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class GeneratedDocumentResponse(BaseModel):
    id: UUID
    lead_id: UUID
    division_id: UUID
    template_id: Optional[UUID]
    doc_type: str
    format: str
    version_number: int
    title: str
    status: str
    s3_key: str
    sharepoint_url: Optional[str]
    docusign_envelope_id: Optional[str]
    docusign_status: Optional[str]
    signed_at: Optional[datetime]
    signed_s3_key: Optional[str]
    signed_sharepoint_url: Optional[str]
    created_by: UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class DocumentApprovalResponse(BaseModel):
    id: UUID
    document_id: UUID
    approver_id: UUID
    approval_stage: str
    action: Optional[str]
    comments: Optional[str]
    actioned_at: Optional[datetime]

    model_config = ConfigDict(from_attributes=True)

class GeneratedDocumentListResponse(BaseModel):
    documents: List[GeneratedDocumentResponse]
    total: int

    model_config = ConfigDict(from_attributes=True)
