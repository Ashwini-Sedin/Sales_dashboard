from typing import Optional
from uuid import UUID
from pydantic import BaseModel, EmailStr

from app.schemas.user import UserCreate, UserPublic as UserResponse

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    user_id: Optional[UUID] = None
