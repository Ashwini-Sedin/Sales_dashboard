import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship

from app.core.database import Base

class Division(Base):
    __tablename__ = "divisions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    description = Column(Text)
    head_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    google_ads_campaign_id = Column(String)
    branding_config = Column(JSONB, default=dict)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relationships
    head_user = relationship("User", foreign_keys=[head_user_id])
    users = relationship("User", foreign_keys="[User.division_id]", back_populates="division")
