from fastapi import APIRouter, Depends, Request, Form, UploadFile, File
from fastapi.responses import PlainTextResponse
from typing import Optional
from uuid import UUID

from app.core.database import get_db
from app.models.user import UserRole
from sqlalchemy.orm import Session
from app.core.dependencies import get_current_active_user, require_roles
from app.tasks.teams_tasks import capture_teams_recordings
from app.services.teams_call_service import store_recording
import asyncio

router = APIRouter(prefix="/api/integrations/teams", tags=["teams"])

@router.post("/webhook")
async def teams_webhook(request: Request):
    validation_token = request.query_params.get("validationToken")
    if validation_token:
        return PlainTextResponse(validation_token)
        
    payload = await request.json()
    
    # Enqueue background task
    capture_teams_recordings.delay()
    
    return {"status": "accepted"}

@router.post("/test-upload")
async def test_upload_recording(
    lead_id: UUID = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user),
    _: None = Depends(require_roles([UserRole.super_admin, UserRole.division_head]))
):
    file_bytes = await file.read()
    
    # Mock a call record
    import uuid
    from datetime import datetime, timezone
    
    mock_call_record = {
        "id": str(uuid.uuid4()),
        "startDateTime": datetime.now(timezone.utc).isoformat(),
        "endDateTime": datetime.now(timezone.utc).isoformat()
    }
    
    recording = await store_recording(db, mock_call_record, lead_id, file_bytes)
    
    return {
        "message": "Test recording uploaded successfully",
        "call_id": str(recording.id),
        "s3_key": recording.s3_key,
        "lead_id": str(lead_id)
    }
