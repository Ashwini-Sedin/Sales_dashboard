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
    lead_company_name: Optional[str] = None
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

class QuickSalesInput(BaseModel):
    proposed_solution_name: str
    pricing_range: str
    start_date: str
    end_date: str
    key_benefits: List[str]  # max 5 items should be handled by validation or frontend, but I'll add a simple validator if needed. For now just List[str]
    client_challenges: List[str] # max 3 items
    notes: Optional[str] = None

class QuickSalesGenerateRequest(BaseModel):
    lead_id: UUID
    format: str  # "docx" or "pptx"
    dynamic_inputs: QuickSalesInput

class DocumentGenerationResponse(BaseModel):
    document_id: UUID
    task_id: str
    status: str
    message: str

class TemplateUploadResponse(BaseModel):
    id: UUID
    template_name: str
    doc_type: str
    format: str
    is_active: bool
    thumbnail_status: str
    message: str

# Session 24 additions
class Phase(BaseModel):
    phase_name: str
    duration: str
    deliverables: List[str]

class PricingItem(BaseModel):
    item_name: str
    quantity: int
    unit_price: float
    discount_percent: float = 0.0

class CustomSection(BaseModel):
    title: str
    content: str

class DetailedProposalInput(BaseModel):
    client_challenges: str
    client_background: str
    solution_description: str
    phases: List[Phase]
    pricing_breakdown: List[PricingItem]
    team_member_ids: List[UUID]
    selected_case_study_ids: List[int]
    custom_sections: List[CustomSection] = []

class DetailedProposalGenerateRequest(BaseModel):
    lead_id: UUID
    format: str
    dynamic_inputs: DetailedProposalInput

class CaseStudyResponse(BaseModel):
    id: int
    division_id: UUID
    title: str
    client_name: str
    industry: str
    technology_tags: List[str]
    challenge_text: str
    solution_text: str
    outcome_text: str
    s3_image_key: Optional[str]
    image_url: Optional[str] = None
    is_active: bool

    model_config = ConfigDict(from_attributes=True)

class CaseStudyCreate(BaseModel):
    division_id: UUID
    title: str
    client_name: str
    industry: str
    technology_tags: List[str] = []
    challenge_text: str
    solution_text: str
    outcome_text: str
    s3_image_key: Optional[str] = None

class CaseStudyUpdate(BaseModel):
    title: Optional[str] = None
    client_name: Optional[str] = None
    industry: Optional[str] = None
    technology_tags: Optional[List[str]] = None
    challenge_text: Optional[str] = None
    solution_text: Optional[str] = None
    outcome_text: Optional[str] = None
    s3_image_key: Optional[str] = None
    is_active: Optional[bool] = None

class DocumentVersionItem(BaseModel):
    id: UUID
    version_number: int
    format: str
    status: str
    title: str
    s3_key: str
    sharepoint_url: Optional[str] = None
    docusign_status: str
    signed_at: Optional[datetime] = None
    signed_s3_key: Optional[str] = None
    signed_sharepoint_url: Optional[str] = None
    created_by: UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class DocumentVersionGroup(BaseModel):
    doc_type: str
    versions: List[DocumentVersionItem]
    latest_version: int
    latest_status: str

class DocumentVersionGroupResponse(BaseModel):
    groups: List[DocumentVersionGroup]
    total_documents: int

class RestoreDocumentResponse(BaseModel):
    new_document: GeneratedDocumentResponse
    restored_from_version: int
    message: str

class ScopeItem(BaseModel):
    item: str
    in_scope: bool

class EffortRow(BaseModel):
    phase: str
    role: str
    days: int
    rate_per_day: float

class RiskItem(BaseModel):
    risk: str
    impact: str
    probability: str
    mitigation: str

class PresalesInput(BaseModel):
    executive_overview: str
    client_background: str
    problem_statement: str
    solution_overview: str
    scope_items: List[ScopeItem]
    assumptions: List[str]
    effort_rows: List[EffortRow]
    commercial_model: str
    risks: List[RiskItem]
    technology_ids: List[int]

class PresalesGenerateRequest(BaseModel):
    lead_id: UUID
    dynamic_inputs: PresalesInput

class TechLibraryResponse(BaseModel):
    id: int
    name: str
    category: str
    is_active: bool
    model_config = ConfigDict(from_attributes=True)

class ApprovalRequest(BaseModel):
    comments: Optional[str] = None

class Party(BaseModel):
    name: str
    designation: str
    email: str
    company: str

class NdaInput(BaseModel):
    nda_type: str  # unilateral | mutual | multilateral
    client_legal_name: str
    client_address: str
    client_signatory_name: str
    client_signatory_title: str
    company_signatory_user_id: UUID
    effective_date: str
    purpose_of_disclosure: str
    term_years: int = 2
    additional_parties: List[Party] = []
    custom_clause_ids: List[int] = []

class NdaGenerateRequest(BaseModel):
    lead_id: UUID
    dynamic_inputs: NdaInput

class NdaClauseResponse(BaseModel):
    id: int
    clause_type: str
    clause_text: str
    is_default: bool
    division_id: UUID | None
    model_config = ConfigDict(from_attributes=True)

class LegalReviewRequest(BaseModel):
    comments: Optional[str] = None
