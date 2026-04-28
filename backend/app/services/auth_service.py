from typing import Optional
from sqlalchemy.orm import Session
from app.models.user import User
from app.schemas.user import UserCreate
from app.core.security import get_password_hash, verify_password

def get_user_by_email(db: Session, email: str) -> Optional[User]:
    return db.query(User).filter(User.email == email).first()

def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
    user = get_user_by_email(db, email)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user

def create_user(db: Session, user_in: UserCreate) -> User:
    db_user = User(
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        first_name=user_in.first_name,
        last_name=user_in.last_name,
        role=user_in.role,
        division_id=user_in.division_id,
        is_active=user_in.is_active
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user
