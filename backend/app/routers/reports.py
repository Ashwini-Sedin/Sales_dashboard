from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from uuid import UUID

from app.core.database import get_db
from app.core.dependencies import get_current_active_user, require_roles
from app.models.user import User, UserRole
from app.reports import lead_reports

router = APIRouter(prefix="/api/reports", tags=["reports"])

@router.get("/dashboard")
def get_dashboard_stats(
    division_id: Optional[UUID] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Security: If not super_admin, can only see their own division
    if current_user.role != UserRole.super_admin:
        division_id = current_user.division_id
        
    return lead_reports.get_dashboard_stats(db, division_id)

@router.get("/turnaround")
def get_turnaround_report(
    division_id: Optional[UUID] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    if current_user.role != UserRole.super_admin:
        division_id = current_user.division_id
        
    report_df = lead_reports.get_turnaround_report(db, division_id, date_from, date_to)
    return report_df.to_dict(orient="records")

@router.get("/funnel")
def get_conversion_funnel(
    division_id: Optional[UUID] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    if current_user.role != UserRole.super_admin:
        division_id = current_user.division_id
        
    return lead_reports.get_conversion_funnel(db, division_id)

@router.get("/performance")
def get_salesperson_performance(
    division_id: Optional[UUID] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    if current_user.role != UserRole.super_admin:
        division_id = current_user.division_id
        
    return lead_reports.get_salesperson_performance(db, division_id)

@router.get("/trends")
def get_monthly_trends(
    division_id: Optional[UUID] = None,
    months: int = Query(6, ge=1, le=24),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    if current_user.role != UserRole.super_admin:
        division_id = current_user.division_id
        
    return lead_reports.get_monthly_trend(db, division_id, months)

@router.get("/export-excel")
def export_leads_excel(
    division_id: Optional[UUID] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    if current_user.role != UserRole.super_admin:
        division_id = current_user.division_id
        
    filters = {"division_id": division_id}
    excel_file = lead_reports.export_leads_excel(db, filters)
    
    filename = f"DealFlow_Report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
    
    return StreamingResponse(
        excel_file,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
