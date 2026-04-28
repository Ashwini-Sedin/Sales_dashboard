from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, Query
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List, Optional

from app.core.database import get_db
from app.core.dependencies import get_current_active_user
from app.models.user import User, UserRole
from app.models.notification import Notification
from app.schemas.lead import LeadCreate, LeadUpdate, LeadResponse, LeadListResponse, LeadFilter, PipelineStageUpdate
from app.services import lead_service

router = APIRouter(prefix="/api/leads", tags=["leads"])

def notify_lead_created(db: Session, lead_id: UUID, owner_id: UUID):
    if owner_id:
        notification = Notification(
            user_id=owner_id,
            lead_id=lead_id,
            type="NEW_LEAD",
            message="A new lead has been assigned to you."
        )
        db.add(notification)
        db.commit()

@router.post("/", response_model=LeadResponse, status_code=status.HTTP_201_CREATED)
def create_lead(
    lead_in: LeadCreate, 
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_active_user)
):
    # Non-admins can only create leads for their division
    if current_user.role not in [UserRole.super_admin] and lead_in.division_id != current_user.division_id:
        raise HTTPException(status_code=403, detail="Not authorized to create leads for this division")
        
    lead = lead_service.create_lead(db, lead_in, current_user.id)
    background_tasks.add_task(notify_lead_created, db, lead.id, lead.owner_id)
    return lead

@router.get("/", response_model=LeadListResponse)
def list_leads(
    division_id: Optional[UUID] = None,
    status: Optional[str] = None,
    source: Optional[str] = None,
    owner_id: Optional[UUID] = None,
    q: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    filters = LeadFilter(
        division_id=division_id,
        status=status,
        source=source,
        owner_id=owner_id,
        q=q
    )
    
    # Division-based access control
    user_div_id = None
    if current_user.role not in [UserRole.super_admin]:
        user_div_id = current_user.division_id
        
    items, total = lead_service.list_leads(db, filters, page, limit, user_div_id)
    return {
        "items": items,
        "total": total,
        "page": page,
        "size": limit
    }

@router.get("/{lead_id}", response_model=LeadResponse)
def get_lead(
    lead_id: UUID, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_active_user)
):
    lead = lead_service.get_lead(db, lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    # Access check
    if current_user.role not in [UserRole.super_admin] and lead.division_id != current_user.division_id:
        raise HTTPException(status_code=403, detail="Access denied")
        
    return lead

@router.put("/{lead_id}", response_model=LeadResponse)
def update_lead(
    lead_id: UUID, 
    lead_in: LeadUpdate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_active_user)
):
    lead = lead_service.get_lead(db, lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
        
    if current_user.role not in [UserRole.super_admin] and lead.division_id != current_user.division_id:
        raise HTTPException(status_code=403, detail="Access denied")
        
    return lead_service.update_lead(db, lead_id, lead_in, current_user.id)

@router.delete("/{lead_id}")
def delete_lead(
    lead_id: UUID, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_active_user)
):
    lead = lead_service.get_lead(db, lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
        
    if current_user.role not in [UserRole.super_admin] and lead.division_id != current_user.division_id:
        raise HTTPException(status_code=403, detail="Access denied")
        
    lead_service.soft_delete_lead(db, lead_id, current_user.id)
    return {"message": "Lead deleted successfully"}

@router.post("/{lead_id}/stage", response_model=LeadResponse)
def change_lead_stage(
    lead_id: UUID, 
    stage_in: PipelineStageUpdate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_active_user)
):
    lead = lead_service.get_lead(db, lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
        
    if current_user.role not in [UserRole.super_admin] and lead.division_id != current_user.division_id:
        raise HTTPException(status_code=403, detail="Access denied")
        
    return lead_service.change_stage(db, lead_id, stage_in.stage, current_user.id, stage_in.notes)

@router.get("/{lead_id}/timeline")
def get_lead_timeline(
    lead_id: UUID, 
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1),
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_active_user)
):
    lead = lead_service.get_lead(db, lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
        
    if current_user.role not in [UserRole.super_admin] and lead.division_id != current_user.division_id:
        raise HTTPException(status_code=403, detail="Access denied")
        
    items, total = lead_service.get_timeline(db, lead_id, page, limit)
    return {
        "items": items,
        "total": total,
        "page": page,
        "size": limit
    }
