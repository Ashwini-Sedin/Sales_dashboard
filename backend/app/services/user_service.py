from typing import List, Optional, Any
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.user import User, UserRole
from app.models.lead import Lead, LeadStatus
from app.schemas.user import UserCreate, UserUpdate
from app.core.security import get_password_hash

def get_user(db: Session, user_id: UUID) -> Optional[User]:
    return db.query(User).filter(User.id == user_id).first()

def get_user_by_email(db: Session, email: str) -> Optional[User]:
    return db.query(User).filter(User.email == email).first()

def list_users(
    db: Session, 
    division_id: Optional[UUID] = None, 
    role: Optional[UserRole] = None, 
    is_active: Optional[bool] = None,
    skip: int = 0,
    limit: int = 100
) -> List[User]:
    query = db.query(User)
    if division_id:
        query = query.filter(User.division_id == division_id)
    if role:
        query = query.filter(User.role == role)
    if is_active is not None:
        query = query.filter(User.is_active == is_active)
    
    return query.offset(skip).limit(limit).all()

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

def update_user(db: Session, user_id: UUID, user_in: UserUpdate) -> Optional[User]:
    db_user = get_user(db, user_id)
    if not db_user:
        return None
    
    update_data = user_in.model_dump(exclude_unset=True)
    if "password" in update_data:
        db_user.hashed_password = get_password_hash(update_data.pop("password"))
    
    for field, value in update_data.items():
        setattr(db_user, field, value)
    
    db.commit()
    db.refresh(db_user)
    return db_user

def deactivate_user(db: Session, user_id: UUID, reassign_to_id: Optional[UUID] = None) -> bool:
    db_user = get_user(db, user_id)
    if not db_user:
        return False
    
    db_user.is_active = False
    
    if reassign_to_id:
        # Reassign open leads (not won or lost)
        open_leads = db.query(Lead).filter(
            Lead.owner_id == user_id,
            Lead.status.notin_([LeadStatus.won, LeadStatus.lost])
        ).all()
        for lead in open_leads:
            lead.owner_id = reassign_to_id
            
    db.commit()
    return True

def get_user_lead_count(db: Session, user_id: UUID) -> int:
    return db.query(func.count(Lead.id)).filter(Lead.owner_id == user_id, Lead.is_deleted == False).scalar()
