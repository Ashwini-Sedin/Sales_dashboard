from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_active_user, require_roles
from app.models.user import User
from app.models.call_recording import CallRecording
from app.models.activity_timeline import ActivityTimeline, ActivityEventType
from app.schemas.call_recording import CallRecordingResponse, PlaybackUrlResponse
from app.services.s3_service import s3_service

router = APIRouter(prefix="/api/leads/{lead_id}/calls", tags=["calls"])

@router.get("/", response_model=List[CallRecordingResponse])
async def get_call_recordings(
    lead_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    stmt = select(CallRecording).where(CallRecording.lead_id == lead_id)
    result = db.execute(stmt)
    recordings = result.scalars().all()
    
    # Division access check
    if current_user.role not in ["super_admin", "division_head"] and recordings:
        if any(r.division_id != current_user.division_id for r in recordings):
            raise HTTPException(status_code=403, detail="Not authorized to view recordings for this lead's division.")

    return recordings

@router.get("/{call_id}/playback-url", response_model=PlaybackUrlResponse)
async def get_playback_url(
    lead_id: UUID,
    call_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    stmt = select(CallRecording).where(
        CallRecording.id == call_id,
        CallRecording.lead_id == lead_id
    )
    recording = db.execute(stmt).scalar_first()
    
    if not recording:
        raise HTTPException(status_code=404, detail="Call recording not found")
        
    # Division access check
    if current_user.role not in ["super_admin", "division_head"] and recording.division_id != current_user.division_id:
        raise HTTPException(status_code=403, detail="Not authorized to access this recording")

    url = s3_service.get_recording_presigned_url(recording.s3_key)
    return {"playback_url": url, "expires_in": 604800}

@router.delete("/{call_id}")
async def delete_call_recording(
    lead_id: UUID,
    call_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    _: None = Depends(require_roles("super_admin", "division_head"))
):
    stmt = select(CallRecording).where(
        CallRecording.id == call_id,
        CallRecording.lead_id == lead_id
    )
    recording = db.execute(stmt).scalar_first()
    
    if not recording:
        raise HTTPException(status_code=404, detail="Call recording not found")

    filename = recording.filename
    db.delete(recording)
    
    # Log activity
    activity = ActivityTimeline(
        lead_id=lead_id,
        actor_id=current_user.id,
        event_type=ActivityEventType.call_recorded,
        description=f"🗑️ Call recording deleted: {filename}",
        metadata_={"filename": filename}
    )
    db.add(activity)
    db.commit()
    
    return {"status": "success"}
