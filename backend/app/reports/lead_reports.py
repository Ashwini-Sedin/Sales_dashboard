import pandas as pd
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta, timezone
import io
from openpyxl import Workbook
from openpyxl.styles import Font, Alignment, PatternFill, Border, Side
from app.models.lead import Lead, LeadStatus, LeadSource
from app.models.user import User
from app.models.division import Division

def get_dashboard_stats(db: Session, division_id: Optional[Any] = None) -> Dict[str, Any]:
    query = db.query(Lead).filter(Lead.is_deleted == False)
    if division_id:
        query = query.filter(Lead.division_id == division_id)
    
    leads_df = pd.read_sql(query.statement, db.bind)
    
    if leads_df.empty:
        return {
            "total_leads": 0,
            "leads_by_stage": {},
            "leads_by_source": {},
            "leads_this_week": 0,
            "estimated_pipeline_value": 0,
            "avg_turnaround_days": 0,
            "win_rate_pct": 0
        }

    total_leads = len(leads_df)
    leads_by_stage = leads_df['status'].value_counts().to_dict()
    leads_by_source = leads_df['source'].value_counts().to_dict()
    
    one_week_ago = datetime.now(timezone.utc) - timedelta(days=7)
    leads_this_week = len(leads_df[leads_df['created_at'] >= one_week_ago])
    
    pipeline_value = leads_df['estimated_value'].sum()
    
    # Turnaround time for Won leads
    won_leads = leads_df[leads_df['status'] == LeadStatus.won].copy()
    avg_turnaround = 0
    if not won_leads.empty and 'won_at' in won_leads.columns and 'created_at' in won_leads.columns:
        won_leads['turnaround'] = (pd.to_datetime(won_leads['won_at']) - pd.to_datetime(won_leads['created_at'])).dt.days
        avg_turnaround = won_leads['turnaround'].mean()

    # Win rate
    closed_leads_count = len(leads_df[leads_df['status'].isin([LeadStatus.won, LeadStatus.lost])])
    win_rate = (len(won_leads) / closed_leads_count * 100) if closed_leads_count > 0 else 0

    return {
        "total_leads": total_leads,
        "leads_by_stage": leads_by_stage,
        "leads_by_source": leads_by_source,
        "leads_this_week": leads_this_week,
        "estimated_pipeline_value": float(pipeline_value),
        "avg_turnaround_days": round(float(avg_turnaround), 1) if not pd.isna(avg_turnaround) else 0,
        "win_rate_pct": round(win_rate, 1)
    }

def get_turnaround_report(db: Session, division_id: Optional[Any] = None, date_from: Optional[datetime] = None, date_to: Optional[datetime] = None) -> pd.DataFrame:
    query = db.query(Lead).filter(and_(Lead.is_deleted == False, Lead.status == LeadStatus.won))
    if division_id:
        query = query.filter(Lead.division_id == division_id)
    if date_from:
        query = query.filter(Lead.won_at >= date_from)
    if date_to:
        query = query.filter(Lead.won_at <= date_to)
        
    df = pd.read_sql(query.statement, db.bind)
    if df.empty:
        return pd.DataFrame(columns=["source", "avg_days", "median_days", "min_days", "max_days", "count"])
    
    df["turnaround_days"] = (pd.to_datetime(df["won_at"]) - pd.to_datetime(df["created_at"])).dt.days
    
    report = df.groupby("source")["turnaround_days"].agg([
        ("avg_days", "mean"),
        ("median_days", "median"),
        ("min_days", "min"),
        ("max_days", "max"),
        ("count", "count")
    ]).reset_index()
    
    return report

def get_conversion_funnel(db: Session, division_id: Optional[Any] = None) -> List[Dict[str, Any]]:
    query = db.query(Lead).filter(Lead.is_deleted == False)
    if division_id:
        query = query.filter(Lead.division_id == division_id)
        
    df = pd.read_sql(query.statement, db.bind)
    if df.empty:
        return []
    
    stages = [s.value for s in LeadStatus]
    counts = df['status'].value_counts()
    
    funnel = []
    prev_count = len(df)
    
    # Overall conversion from total leads
    for stage in stages:
        count = counts.get(stage, 0)
        conversion_rate = (count / prev_count * 100) if prev_count > 0 else 0
        funnel.append({
            "stage": stage.capitalize(),
            "count": int(count),
            "conversion_rate": round(conversion_rate, 1)
        })
        # For a real funnel, we might want to use a different denominator 
        # but here we'll just show the distribution
    
    return funnel

def get_salesperson_performance(db: Session, division_id: Optional[Any] = None) -> List[Dict[str, Any]]:
    query = db.query(Lead, User.first_name, User.last_name).join(User, Lead.owner_id == User.id).filter(Lead.is_deleted == False)
    if division_id:
        query = query.filter(Lead.division_id == division_id)
        
    df = pd.read_sql(query.statement, db.bind)
    if df.empty:
        return []
    
    df['salesperson'] = df['first_name'] + " " + df['last_name']
    
    perf = []
    for name, group in df.groupby('salesperson'):
        assigned = len(group)
        won = len(group[group['status'] == LeadStatus.won])
        win_rate = (won / assigned * 100) if assigned > 0 else 0
        
        won_group = group[group['status'] == LeadStatus.won].copy()
        avg_turnaround = 0
        if not won_group.empty:
            won_group['turnaround'] = (pd.to_datetime(won_group['won_at']) - pd.to_datetime(won_group['created_at'])).dt.days
            avg_turnaround = won_group['turnaround'].mean()
            
        perf.append({
            "salesperson": name,
            "leads_assigned": assigned,
            "leads_won": won,
            "win_rate": round(win_rate, 1),
            "avg_turnaround": round(float(avg_turnaround), 1) if not pd.isna(avg_turnaround) else 0
        })
        
    return sorted(perf, key=lambda x: x['leads_won'], reverse=True)

def get_monthly_trend(db: Session, division_id: Optional[Any] = None, months: int = 6) -> List[Dict[str, Any]]:
    cutoff_date = datetime.now(timezone.utc) - timedelta(days=months*30)
    query = db.query(Lead).filter(and_(Lead.is_deleted == False, Lead.created_at >= cutoff_date))
    if division_id:
        query = query.filter(Lead.division_id == division_id)
        
    df = pd.read_sql(query.statement, db.bind)
    if df.empty:
        return []
    
    df['month'] = pd.to_datetime(df['created_at']).dt.strftime('%Y-%m')
    
    trends = []
    for month, group in df.groupby('month'):
        trends.append({
            "month": month,
            "total_leads": len(group),
            "won_leads": len(group[group['status'] == LeadStatus.won])
        })
        
    return sorted(trends, key=lambda x: x['month'])

def export_leads_excel(db: Session, filters: Dict[str, Any]) -> io.BytesIO:
    query = db.query(Lead).filter(Lead.is_deleted == False)
    if filters.get('division_id'):
        query = query.filter(Lead.division_id == filters['division_id'])
    # Add more filters as needed
    
    df = pd.read_sql(query.statement, db.bind)
    
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        # Sheet 1: Summary
        stats = get_dashboard_stats(db, filters.get('division_id'))
        summary_df = pd.DataFrame([
            {"Metric": "Total Leads", "Value": stats['total_leads']},
            {"Metric": "Pipeline Value", "Value": stats['estimated_pipeline_value']},
            {"Metric": "Avg Turnaround (Days)", "Value": stats['avg_turnaround_days']},
            {"Metric": "Win Rate (%)", "Value": stats['win_rate_pct']}
        ])
        summary_df.to_excel(writer, sheet_name='Summary', index=False)
        
        # Sheet 2: Lead Detail
        df.to_excel(writer, sheet_name='Lead Detail', index=False)
        
        # Sheet 3: Turnaround Analysis
        turnaround_df = get_turnaround_report(db, filters.get('division_id'))
        turnaround_df.to_excel(writer, sheet_name='Turnaround Analysis', index=False)
        
        # Formatting (optional but nice)
        workbook = writer.book
        for sheetname in workbook.sheetnames:
            worksheet = workbook[sheetname]
            for col in worksheet.columns:
                max_length = 0
                column = col[0].column_letter
                for cell in col:
                    try:
                        if len(str(cell.value)) > max_length:
                            max_length = len(str(cell.value))
                    except:
                        pass
                adjusted_width = (max_length + 2)
                worksheet.column_dimensions[column].width = adjusted_width

    output.seek(0)
    return output
