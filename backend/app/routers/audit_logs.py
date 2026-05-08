from typing import List, Optional
from uuid import UUID
from datetime import datetime
from fastapi import APIRouter, Depends, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import require_roles
from app.models.user import User, UserRole
from app.schemas.audit import AuditLog as AuditLogSchema
from app.services import audit_service

router = APIRouter(prefix="/api/audit-logs", tags=["audit-logs"])

@router.get("/", response_model=List[AuditLogSchema])
def list_audit_logs(
    user_id: Optional[UUID] = None,
    action: Optional[str] = None,
    entity_type: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.super_admin]))
):
    logs = audit_service.list_audit_logs(
        db, 
        user_id=user_id, 
        action=action, 
        entity_type=entity_type, 
        start_date=start_date, 
        end_date=end_date, 
        skip=skip, 
        limit=limit
    )
    return logs

@router.get("/export")
def export_audit_logs(
    user_id: Optional[UUID] = None,
    action: Optional[str] = None,
    entity_type: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.super_admin]))
):
    filters = {
        "user_id": user_id,
        "action": action,
        "entity_type": entity_type,
        "start_date": start_date,
        "end_date": end_date
    }
    
    log_generator = audit_service.generate_audit_log_csv(db, filters)
    
    filename = f"audit_logs_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    
    return StreamingResponse(
        log_generator,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
