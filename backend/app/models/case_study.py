from sqlalchemy import Column, String, Boolean, ForeignKey, Text, Integer
from sqlalchemy.dialects.postgresql import UUID, ARRAY

from app.core.database import Base

class CaseStudy(Base):
    __tablename__ = "case_studies"

    id = Column(Integer, primary_key=True, autoincrement=True)
    division_id = Column(UUID(as_uuid=True), ForeignKey("divisions.id"))
    title = Column(String(255))
    client_name = Column(String(255))
    industry = Column(String(150))
    technology_tags = Column(ARRAY(Text))
    challenge_text = Column(Text)
    solution_text = Column(Text)
    outcome_text = Column(Text)
    s3_image_key = Column(String(1000))
    is_active = Column(Boolean)
