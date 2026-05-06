from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from uuid import UUID
from datetime import datetime
from typing import Optional, List
from fastapi import BackgroundTasks

from app.models.lead import Lead, LeadStatus
from app.models.activity import ActivityTimeline, ActivityEventType
from app.models.pipeline import LeadPipelineStage
from app.models.audit import AuditLog
from app.schemas.lead import LeadCreate, LeadUpdate, LeadFilter

def log_activity(db: Session, lead_id: UUID, actor_id: UUID, event_type: ActivityEventType, description: str, metadata: dict = None):
    activity = ActivityTimeline(
        lead_id=lead_id,
        actor_id=actor_id,
        event_type=event_type,
        description=description,
        metadata_=metadata or {}
    )
    db.add(activity)
    db.commit()

def create_lead(db: Session, lead_data: LeadCreate, creator_id: UUID, background_tasks: BackgroundTasks = None) -> Lead:
    db_lead = Lead(**lead_data.model_dump())
    db.add(db_lead)
    db.commit()
    db.refresh(db_lead)
    
    log_activity(
        db, db_lead.id, creator_id, 
        ActivityEventType.lead_created, 
        f"Lead created by user {creator_id}"
    )
    
    if background_tasks:
        from app.services.notification_service import notification_service
        background_tasks.add_task(notification_service.notify_new_lead, db, db_lead.id)
        
    return db_lead

def get_lead(db: Session, lead_id: UUID) -> Optional[Lead]:
    return db.query(Lead).filter(Lead.id == lead_id, Lead.is_deleted == False).first()

def list_leads(db: Session, filters: LeadFilter, page: int = 1, limit: int = 20, user_division_id: UUID = None):
    query = db.query(Lead).filter(Lead.is_deleted == False)
    
    if user_division_id:
        query = query.filter(Lead.division_id == user_division_id)
    
    if filters.division_id:
        query = query.filter(Lead.division_id == filters.division_id)
    if filters.status:
        query = query.filter(Lead.status == filters.status)
    if filters.source:
        query = query.filter(Lead.source == filters.source)
    if filters.owner_id:
        query = query.filter(Lead.owner_id == filters.owner_id)
    if filters.date_from:
        query = query.filter(Lead.created_at >= filters.date_from)
    if filters.date_to:
        query = query.filter(Lead.created_at <= filters.date_to)
    if filters.q:
        search = f"%{filters.q}%"
        query = query.filter(or_(
            Lead.first_name.ilike(search),
            Lead.last_name.ilike(search),
            Lead.company_name.ilike(search),
            Lead.email.ilike(search)
        ))
    
    total = query.count()
    items = query.offset((page - 1) * limit).limit(limit).all()
    return items, total

def update_lead(db: Session, lead_id: UUID, data: LeadUpdate, user_id: UUID) -> Optional[Lead]:
    db_lead = get_lead(db, lead_id)
    if not db_lead:
        return None
    
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_lead, key, value)
    
    if data.status == LeadStatus.won and not db_lead.won_at:
        db_lead.won_at = datetime.utcnow()
        
    db.commit()
    db.refresh(db_lead)
    
    log_activity(
        db, lead_id, user_id, 
        ActivityEventType.stage_changed, 
        f"Lead information updated"
    )
    return db_lead

def soft_delete_lead(db: Session, lead_id: UUID, user_id: UUID) -> bool:
    db_lead = get_lead(db, lead_id)
    if not db_lead:
        return False
    
    db_lead.is_deleted = True
    
    # Audit Log
    audit = AuditLog(
        user_id=user_id,
        action="SOFT_DELETE",
        entity_type="LEAD",
        entity_id=str(lead_id)
    )
    db.add(audit)
    db.commit()
    return True

def change_stage(db: Session, lead_id: UUID, stage: LeadStatus, user_id: UUID, notes: str = None) -> Optional[Lead]:
    db_lead = get_lead(db, lead_id)
    if not db_lead:
        return None
    
    old_stage = db_lead.status
    db_lead.status = stage
    
    if stage == LeadStatus.won:
        db_lead.won_at = datetime.utcnow()
    
    # Log to pipeline stages
    pipeline = LeadPipelineStage(
        lead_id=lead_id,
        stage=stage.value,
        changed_by=user_id,
        notes=notes
    )
    db.add(pipeline)
    
    log_activity(
        db, lead_id, user_id, 
        ActivityEventType.stage_changed, 
        f"Stage changed from {old_stage} to {stage}",
        metadata={"old_stage": old_stage, "new_stage": stage, "notes": notes}
    )
    
    db.commit()
    db.refresh(db_lead)
    return db_lead

def get_timeline(db: Session, lead_id: UUID, page: int = 1, limit: int = 20):
    query = db.query(ActivityTimeline).filter(ActivityTimeline.lead_id == lead_id)
    total = query.count()
    items = query.order_by(ActivityTimeline.created_at.desc()).offset((page - 1) * limit).limit(limit).all()
    return items, total
