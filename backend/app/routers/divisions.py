from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_active_user, require_roles
from app.models.user import User, UserRole
from app.schemas.division import DivisionCreate, DivisionUpdate, DivisionResponse
from app.services import division_service

router = APIRouter(prefix="/api/divisions", tags=["divisions"])

@router.get("/", response_model=List[DivisionResponse])
def list_divisions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    divisions = division_service.list_divisions(db)
    return divisions

@router.post("/", response_model=DivisionResponse, status_code=status.HTTP_201_CREATED)
def create_division(
    division_in: DivisionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.super_admin]))
):
    division = division_service.create_division(db, division_in=division_in)
    return division

@router.put("/{id}", response_model=DivisionResponse)
def update_division(
    id: UUID,
    division_in: DivisionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.super_admin]))
):
    division = division_service.update_division(db, division_id=id, division_in=division_in)
    if not division:
        raise HTTPException(status_code=404, detail="Division not found")
    return division
