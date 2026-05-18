from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_active_user, require_roles
from app.models.user import User, UserRole
from app.schemas.user import UserCreate, UserUpdate, UserPublic, UserWithDivision
from app.services import user_service
from app.services.notification_service import notification_service

router = APIRouter(prefix="/api/users", tags=["users"])

@router.get("/", response_model=List[UserPublic])
def list_users(
    division_id: Optional[UUID] = None,
    role: Optional[UserRole] = None,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.admin, UserRole.division_head]))
):
    users = user_service.list_users(db, division_id=division_id, role=role, is_active=is_active)
    return users

@router.post("/", response_model=UserPublic, status_code=status.HTTP_201_CREATED)
def create_user(
    user_in: UserCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.admin]))
):
    db_user = user_service.get_user_by_email(db, email=user_in.email)
    if db_user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system",
        )
    user = user_service.create_user(db, user_in=user_in)
    background_tasks.add_task(notification_service.notify_welcome, db, user.id)
    return user

@router.get("/{user_id}", response_model=UserWithDivision)
def get_user(
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    user = user_service.get_user(db, user_id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.lead_count = user_service.get_user_lead_count(db, user_id=user_id)
    return user

@router.put("/{user_id}", response_model=UserPublic)
def update_user(
    user_id: UUID,
    user_in: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    db_user = user_service.get_user(db, user_id=user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Permission check: super_admin can update anyone, division_head can update users in their division
    if current_user.role == UserRole.admin:
        pass
    elif current_user.role == UserRole.division_head:
        if db_user.division_id != current_user.division_id:
            raise HTTPException(status_code=403, detail="Not enough permissions to update this user")
    elif current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Not enough permissions to update this user")
        
    user = user_service.update_user(db, user_id=user_id, user_in=user_in)
    return user

@router.post("/{user_id}/deactivate")
def deactivate_user(
    user_id: UUID,
    reassign_to_id: Optional[UUID] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.admin, UserRole.division_head]))
):
    db_user = user_service.get_user(db, user_id=user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if current_user.role == UserRole.division_head and db_user.division_id != current_user.division_id:
        raise HTTPException(status_code=403, detail="Not enough permissions to deactivate this user")

    success = user_service.deactivate_user(db, user_id=user_id, reassign_to_id=reassign_to_id)
    if not success:
        raise HTTPException(status_code=400, detail="Deactivation failed")
    
    return {"detail": "User deactivated successfully"}
