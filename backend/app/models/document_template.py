import enum
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base

class DocType(str, enum.Enum):
    quick_sales = "quick_sales"
    detailed_proposal = "detailed_proposal"
    presales = "presales"
    nda = "nda"
    sow = "sow"

class DocFormat(str, enum.Enum):
    pptx = "pptx"
    docx = "docx"

class DocumentTemplate(Base):
    __tablename__ = "document_templates"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    division_id = Column(UUID(as_uuid=True), ForeignKey("divisions.id"), nullable=True)
    doc_type = Column(Enum(DocType))
    format = Column(Enum(DocFormat))
    template_name = Column(String(255))
    s3_key = Column(String(1000))
    thumbnail_s3_key = Column(String(1000))
    is_active = Column(Boolean)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
