import enum
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Enum, Text
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base

class UserRole(str, enum.Enum):
    super_admin = "Chief Executive Officer"
    admin = "Chief Executive Officer"  # Alias for compatibility with routers using UserRole.admin
    division_head = "Division Head"
    sales_manager = "Sales Manager"
    salesperson = "Business Development Executive"
    presales_engineer = "Presales Consultant"
    legal = "Legal Counsel"
    viewer = "Operations Analyst"

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, index=True)
    hashed_password = Column(String(255))
    first_name = Column(String(100))
    last_name = Column(String(100))
    role = Column(Enum(UserRole, name="user_role", values_callable=lambda obj: [e.value for e in obj]), nullable=False)
    division_id = Column(UUID(as_uuid=True), ForeignKey("divisions.id"))
    bio = Column(Text)
    avatar_url = Column(String(500))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
