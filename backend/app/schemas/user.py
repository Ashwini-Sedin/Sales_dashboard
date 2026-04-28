from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, EmailStr, ConfigDict

from app.models.user import UserRole

class UserBase(BaseModel):
    email: EmailStr
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    role: UserRole = UserRole.viewer
    division_id: Optional[UUID] = None
    is_active: Optional[bool] = True

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    password: Optional[str] = None
    role: Optional[UserRole] = None
    division_id: Optional[UUID] = None
    is_active: Optional[bool] = None

class UserInDB(UserBase):
    id: UUID
    hashed_password: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class UserPublic(UserBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
