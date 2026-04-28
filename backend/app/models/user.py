import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base

class UserRole(str, enum.Enum):
    super_admin = "super_admin"
    division_head = "division_head"
    sales_manager = "sales_manager"
    salesperson = "salesperson"
    presales_engineer = "presales_engineer"
    legal = "legal"
    viewer = "viewer"

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    first_name = Column(String)
    last_name = Column(String)
    role = Column(Enum(UserRole), default=UserRole.viewer, nullable=False)
    division_id = Column(UUID(as_uuid=True), ForeignKey("divisions.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    division = relationship("Division", foreign_keys=[division_id], back_populates="users")
