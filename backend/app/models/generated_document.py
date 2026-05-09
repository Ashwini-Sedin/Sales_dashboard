import enum
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base

class GeneratedDocType(str, enum.Enum):
    quick_sales = "quick_sales"
    detailed_proposal = "detailed_proposal"
    presales = "presales"
    nda = "nda"
    sow = "sow"

class GeneratedDocFormat(str, enum.Enum):
    pptx = "pptx"
    docx = "docx"

class GeneratedDocStatus(str, enum.Enum):
    draft = "draft"
    pending_approval = "pending_approval"
    pending_manager_review = "pending_manager_review"
    pending_legal_review = "pending_legal_review"
    pending_final_approval = "pending_final_approval"
    approved = "approved"
    sent_for_signature = "sent_for_signature"
    signed = "signed"
    archived = "archived"

class DocuSignStatus(str, enum.Enum):
    not_sent = "not_sent"
    sent = "sent"
    viewed = "viewed"
    partially_signed = "partially_signed"
    completed = "completed"
    declined = "declined"
    voided = "voided"

class GeneratedDocument(Base):
    __tablename__ = "generated_documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    lead_id = Column(UUID(as_uuid=True), ForeignKey("leads.id"))
    division_id = Column(UUID(as_uuid=True), ForeignKey("divisions.id"))
    template_id = Column(UUID(as_uuid=True), ForeignKey("document_templates.id"), nullable=True)
    doc_type = Column(Enum(GeneratedDocType))
    format = Column(Enum(GeneratedDocFormat))
    version_number = Column(Integer)
    title = Column(String(500))
    status = Column(Enum(GeneratedDocStatus))
    s3_key = Column(String(1000))
    sharepoint_url = Column(String(1000))
    docusign_envelope_id = Column(String(255))
    docusign_status = Column(Enum(DocuSignStatus))
    signed_at = Column(DateTime(timezone=True))
    signed_s3_key = Column(String(1000))
    signed_sharepoint_url = Column(String(1000))
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
