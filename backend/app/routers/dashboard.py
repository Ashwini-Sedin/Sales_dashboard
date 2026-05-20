from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timezone, timedelta
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.lead import Lead, LeadStatus, LeadSource
from app.models.generated_document import GeneratedDocument, GeneratedDocStatus, DocuSignStatus
from app.models.activity_timeline import ActivityTimeline

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

@router.get("/stats")
def get_dashboard_stats(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    # Total Leads
    total_leads = db.query(Lead).filter(Lead.is_deleted == False).count()
    
    # Pipeline Value (sum of estimated_value for active leads)
    pipeline_value_sum = db.query(func.sum(Lead.estimated_value)).filter(
        Lead.is_deleted == False,
        Lead.status.not_in([LeadStatus.won, LeadStatus.lost])
    ).scalar() or 0
    
    # Format pipeline value to something like ₹2.4Cr or $4.2M based on the user's currency. Let's just use $ for now.
    pipeline_value = f"${pipeline_value_sum / 1000000:.1f}M" if pipeline_value_sum >= 1000000 else f"${pipeline_value_sum:,.0f}"
    
    # Docs Awaiting (sent for signature or pending approval)
    docs_awaiting = db.query(GeneratedDocument).filter(
        GeneratedDocument.status.in_([GeneratedDocStatus.pending_approval, GeneratedDocStatus.pending_manager_review, GeneratedDocStatus.pending_legal_review, GeneratedDocStatus.pending_final_approval, GeneratedDocStatus.sent_for_signature])
    ).count()
    
    # Avg Turnaround (mock for now or calculated simply)
    avg_turnaround = 4.5
    
    # Pipeline by stage
    stages = db.query(Lead.status, func.count(Lead.id)).filter(Lead.is_deleted == False).group_by(Lead.status).all()
    stage_counts = {stage: count for stage, count in stages}
    pipeline_by_stage = [
        {"label": "New", "count": stage_counts.get(LeadStatus.new, 0), "color": "bg-df-accent"},
        {"label": "Contacted", "count": stage_counts.get(LeadStatus.contacted, 0), "color": "bg-df-purple"},
        {"label": "Qualified", "count": stage_counts.get(LeadStatus.qualified, 0), "color": "bg-green-500"},
        {"label": "Proposal", "count": stage_counts.get(LeadStatus.proposal_sent, 0), "color": "bg-df-yellow"},
        {"label": "Negotiation", "count": stage_counts.get(LeadStatus.negotiation, 0), "color": "bg-df-pink"},
        {"label": "Won", "count": stage_counts.get(LeadStatus.won, 0), "color": "bg-df-accent"}
    ]
    # Calculate widths based on max
    max_count = max([s["count"] for s in pipeline_by_stage] + [1])
    for s in pipeline_by_stage:
        s["width"] = f"{(s['count'] / max_count) * 100}%"
        
    # Leads by source
    sources = db.query(Lead.source, func.count(Lead.id)).filter(Lead.is_deleted == False).group_by(Lead.source).all()
    source_counts = {source: count for source, count in sources}
    leads_by_source = [
        {"label": "Google Ads", "count": source_counts.get(LeadSource.google_ads, 0), "dot": "text-df-accent"},
        {"label": "Manual", "count": source_counts.get(LeadSource.manual, 0), "dot": "text-df-purple"},
        {"label": "Referral", "count": source_counts.get(LeadSource.referral, 0), "dot": "text-green-500"},
        {"label": "Event", "count": source_counts.get(LeadSource.event, 0), "dot": "text-df-yellow"},
        {"label": "Other", "count": source_counts.get(LeadSource.other, 0), "dot": "text-gray-500"}
    ]
    leads_by_source.sort(key=lambda x: x["count"], reverse=True)
    
    # Docs Signed this quarter
    now = datetime.now(timezone.utc)
    quarter_start = datetime(now.year, (now.month - 1) // 3 * 3 + 1, 1, tzinfo=timezone.utc)
    docs_signed = db.query(GeneratedDocument).filter(
        GeneratedDocument.docusign_status == DocuSignStatus.completed,
        GeneratedDocument.signed_at >= quarter_start
    ).count()
    
    # Recent Activity
    recent_activities = db.query(ActivityTimeline).order_by(ActivityTimeline.created_at.desc()).limit(5).all()
    recent_activity_list = []
    for activity in recent_activities:
        recent_activity_list.append({
            "id": str(activity.id),
            "description": activity.description,
            "created_at": activity.created_at.isoformat(),
            "event_type": activity.event_type.value
        })
        
    return {
        "totalLeads": total_leads,
        "pipelineValue": pipeline_value,
        "docsAwaiting": docs_awaiting,
        "avgTurnaround": avg_turnaround,
        "pipelineByStage": pipeline_by_stage,
        "leadsBySource": leads_by_source,
        "docsSigned": docs_signed,
        "recentActivity": recent_activity_list
    }
