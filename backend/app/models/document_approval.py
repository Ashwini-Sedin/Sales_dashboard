import enum
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, DateTime, ForeignKey, Enum, Text
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base

class ApprovalStage(str, enum.Enum):
    manager = "manager"
    legal = "legal"
    final = "final"
    division_head = "division_head"

class ApprovalAction(str, enum.Enum):
    approved = "approved"
    rejected = "rejected"

class DocumentApproval(Base):
    __tablename__ = "document_approvals"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id = Column(UUID(as_uuid=True), ForeignKey("generated_documents.id"))
    approver_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    approval_stage = Column(Enum(ApprovalStage))
    action = Column(Enum(ApprovalAction))
    comments = Column(Text)
    actioned_at = Column(DateTime(timezone=True))
