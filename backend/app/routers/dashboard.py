from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

@router.get("/stats")
def get_dashboard_stats(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    # This would normally query the database based on the current user's division
    # For now, we return sample data
    return {
        "totalLeads": 1240,
        "pipelineValue": "$4.2M",
        "docsAwaiting": 12,
        "avgTurnaround": 4.5
    }
