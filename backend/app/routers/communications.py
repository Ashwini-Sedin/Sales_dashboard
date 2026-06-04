from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.core.database import get_db
from app.core.dependencies import get_current_active_user
from app.models.user import User, UserRole
from app.models.email_message import EmailMessage
from app.models.call_recording import CallRecording
from app.schemas.email import EmailMessageResponse
from app.schemas.call_recording import CallRecordingResponse
from app.models.lead import Lead

router = APIRouter(prefix="/api/communications", tags=["communications"])

@router.get("/emails")
def get_global_emails(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = db.query(EmailMessage).join(Lead)
    
    # Division-based access control
    if current_user.role not in [UserRole.admin, UserRole.super_admin, UserRole.ceo]:
        query = query.filter(Lead.division_id == current_user.division_id)
        
    total = query.count()
    emails = query.order_by(desc(EmailMessage.received_at)).offset((page - 1) * limit).limit(limit).all()
    
    response_items = [EmailMessageResponse.model_validate(email) for email in emails]
    
    return {
        "items": response_items,
        "total": total,
        "page": page,
        "size": limit,
        "pages": (total + limit - 1) // limit if limit > 0 else 0
    }

@router.get("/calls", response_model=List[CallRecordingResponse])
def get_global_calls(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = db.query(CallRecording)
    
    # Division-based access control
    if current_user.role not in [UserRole.admin, UserRole.super_admin, UserRole.ceo]:
        query = query.filter(CallRecording.division_id == current_user.division_id)
        
    recordings = query.order_by(desc(CallRecording.recorded_at)).limit(100).all()
    return recordings
