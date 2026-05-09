import enum
from sqlalchemy import Column, Boolean, ForeignKey, Enum, Text, Integer
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base

class NDAClauseType(str, enum.Enum):
    confidentiality = "confidentiality"
    exclusions = "exclusions"
    obligations = "obligations"
    term = "term"
    governing_law = "governing_law"
    dispute_resolution = "dispute_resolution"
    ip = "ip"
    entire_agreement = "entire_agreement"
    severability = "severability"
    waiver = "waiver"

class NDAClause(Base):
    __tablename__ = "nda_clauses"

    id = Column(Integer, primary_key=True, autoincrement=True)
    clause_type = Column(Enum(NDAClauseType))
    clause_text = Column(Text)
    is_default = Column(Boolean)
    division_id = Column(UUID(as_uuid=True), ForeignKey("divisions.id"), nullable=True)
