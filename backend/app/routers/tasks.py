# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends, HTTPException
from celery.result import AsyncResult
from app.tasks.celery_app import celery_app
from app.core.dependencies import get_current_active_user

router = APIRouter(tags=["tasks"])

@router.get("/{task_id}/status")
async def get_task_status(
    task_id: str,
    current_user = Depends(get_current_active_user)
):
    result = AsyncResult(task_id, app=celery_app)
    
    # State values from Celery:
    # PENDING → "Queued"
    # STARTED → "In Progress"
    # SUCCESS → "Complete"
    # FAILURE → "Failed"
    # RETRY   → "Retrying"
    
    status_map = {
        "PENDING": "Queued",
        "STARTED": "In Progress",
        "SUCCESS": "Complete",
        "FAILURE": "Failed",
        "RETRY": "Retrying"
    }
    
    status_text = status_map.get(result.state, result.state)
    
    return {
        "task_id": task_id,
        "status": status_text,
        "result": result.result if result.ready() and not result.failed() else None,
        "error": str(result.result) if result.failed() else None
    }
