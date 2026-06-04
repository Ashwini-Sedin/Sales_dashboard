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

@router.post("/", response_model=LeadResponse, status_code=status.HTTP_201_CREATED)
def create_lead(
    lead_in: LeadCreate, 
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_active_user)
):
    # Non-admins can only create leads for their division
    if current_user.role in [UserRole.legal, UserRole.viewer]:
        raise HTTPException(status_code=403, detail="Viewer and legal roles cannot create leads")
    if current_user.role not in [UserRole.admin, UserRole.super_admin, UserRole.ceo] and lead_in.division_id != current_user.division_id:
        raise HTTPException(status_code=403, detail="Not authorized to create leads for this division")
        
    lead = lead_service.create_lead(db, lead_in, current_user.id, background_tasks=background_tasks)
    return lead

@router.get("/", response_model=LeadListResponse)
def list_leads(
    division_id: Optional[UUID] = None,
    status: Optional[List[str]] = Query(None),
    source: Optional[str] = None,
    owner_id: Optional[UUID] = None,
    q: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=10000),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Convert status strings to LeadStatus enums if provided
    from app.models.lead import LeadStatus as LeadStatusEnum
    status_enums = None
    if status:
        status_enums = []
        for s in status:
            try:
                status_enums.append(LeadStatusEnum(s))
            except ValueError:
                pass
        if not status_enums:
            status_enums = None

    filters = LeadFilter(
        division_id=division_id,
        status=status_enums,
        source=source,
        owner_id=owner_id,
        q=q
    )
    
    # Division-based access control
    user_div_id = None
    if current_user.role not in [UserRole.admin, UserRole.super_admin, UserRole.ceo]:
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
    global_roles = [UserRole.admin, UserRole.super_admin, UserRole.ceo, UserRole.legal, UserRole.viewer]
    if current_user.role not in global_roles and lead.division_id != current_user.division_id:
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
        
    if current_user.role in [UserRole.legal, UserRole.viewer]:
        raise HTTPException(status_code=403, detail="Viewer and legal roles cannot modify leads")
    if current_user.role not in [UserRole.admin, UserRole.super_admin, UserRole.ceo] and lead.division_id != current_user.division_id:
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
        
    if current_user.role in [UserRole.legal, UserRole.viewer]:
        raise HTTPException(status_code=403, detail="Viewer and legal roles cannot modify leads")
    if current_user.role not in [UserRole.admin, UserRole.super_admin, UserRole.ceo] and lead.division_id != current_user.division_id:
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
        
    if current_user.role in [UserRole.legal, UserRole.viewer]:
        raise HTTPException(status_code=403, detail="Viewer and legal roles cannot modify leads")
    if current_user.role not in [UserRole.admin, UserRole.super_admin, UserRole.ceo] and lead.division_id != current_user.division_id:
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
        
    global_roles = [UserRole.admin, UserRole.super_admin, UserRole.ceo, UserRole.legal, UserRole.viewer]
    if current_user.role not in global_roles and lead.division_id != current_user.division_id:
        raise HTTPException(status_code=403, detail="Access denied")
        
    items, total = lead_service.get_timeline(db, lead_id, page, limit)
    return {
        "items": items,
        "total": total,
        "page": page,
        "size": limit
    }

@router.post("/{lead_id}/notes")
def add_lead_note(
    lead_id: UUID, 
    note_in: dict, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_active_user)
):
    return lead_service.add_note(db, lead_id, note_in.get("note", ""), current_user.id)

@router.put("/{lead_id}/team", response_model=LeadResponse)
def update_lead_team(
    lead_id: UUID, 
    team: List[dict], 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_active_user)
):
    return lead_service.update_team(db, lead_id, team, current_user.id)
