from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from pydantic import BaseModel, ConfigDict
from datetime import datetime

from app.core.database import get_db
from app.core.dependencies import get_current_active_user
from app.models.user import User
from app.models.notification import Notification
from app.services.notification_service import notification_service

router = APIRouter(prefix="/api/notifications", tags=["notifications"])

class NotificationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    lead_id: UUID | None = None
    type: str
    message: str
    is_read: bool
    created_at: datetime

class TestEmailRequest(BaseModel):
    to_email: str
    subject: str = "Test Email"
    template_name: str = "new_lead.html"

@router.get("/", response_model=List[NotificationResponse])
def get_user_notifications(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    return db.query(Notification).filter(Notification.user_id == current_user.id).order_by(Notification.created_at.desc()).all()

@router.put("/{id}/read")
def mark_notification_read(id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    notification = db.query(Notification).filter(Notification.id == id, Notification.user_id == current_user.id).first()
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    notification.is_read = True
    db.commit()
    return {"status": "success"}

@router.post("/test")
def send_test_email(
    request: TestEmailRequest, 
    background_tasks: BackgroundTasks, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_active_user)
):
    context = {
        "lead_name": "Test Lead",
        "company_name": "Test Company",
        "lead_email": "test@example.com",
        "lead_phone": "123-456-7890",
        "division_name": "Test Division",
        "action_url": "https://app.dealflow.com/leads/test",
        "year": datetime.utcnow().year,
    }
    background_tasks.add_task(
        notification_service.send_email,
        to_emails=[request.to_email],
        subject=request.subject,
        template_name=request.template_name,
        context=context
    )
    return {"status": "email queued"}
