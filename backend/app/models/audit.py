import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship

from app.core.database import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    action = Column(String, nullable=False)
    entity_type = Column(String, nullable=False)
    entity_id = Column(String, nullable=False)
    old_value = Column(JSONB, nullable=True)
    new_value = Column(JSONB, nullable=True)
    ip_address = Column(String)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relationships
    user = relationship("User")
