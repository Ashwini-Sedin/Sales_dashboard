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
    
    leads = query.all()
    leads_data = []
    for lead in leads:
        lead_dict = {col.name: getattr(lead, col.name) for col in lead.__table__.columns}
        leads_data.append(lead_dict)
    leads_df = pd.DataFrame(leads_data)
    
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
        "estimated_pipeline_value": float(pipeline_value) if not pd.isna(pipeline_value) else 0,
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
        
    leads = query.all()
    leads_data = []
    for lead in leads:
        lead_dict = {col.name: getattr(lead, col.name) for col in lead.__table__.columns}
        leads_data.append(lead_dict)
    df = pd.DataFrame(leads_data)
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
        
    leads = query.all()
    leads_data = []
    for lead in leads:
        lead_dict = {col.name: getattr(lead, col.name) for col in lead.__table__.columns}
        leads_data.append(lead_dict)
    df = pd.DataFrame(leads_data)
    if df.empty:
        return []
    
    stages = [s.value for s in LeadStatus]
    counts = df['status'].value_counts()
    
    funnel = []
    prev_count = len(df)
    
    for stage in stages:
        count = counts.get(stage, 0)
        conversion_rate = (count / prev_count * 100) if prev_count > 0 else 0
        funnel.append({
            "stage": stage.capitalize(),
            "count": int(count),
            "conversion_rate": round(conversion_rate, 1)
        })
    
    return funnel

def get_salesperson_performance(db: Session, division_id: Optional[Any] = None) -> List[Dict[str, Any]]:
    query = db.query(Lead, User.first_name, User.last_name).join(User, Lead.owner_id == User.id).filter(Lead.is_deleted == False)
    if division_id:
        query = query.filter(Lead.division_id == division_id)
        
    results = query.all()
    if not results:
        return []
    data = []
    for lead, first_name, last_name in results:
        lead_dict = {col.name: getattr(lead, col.name) for col in lead.__table__.columns}
        lead_dict["first_name"] = first_name
        lead_dict["last_name"] = last_name
        data.append(lead_dict)
    df = pd.DataFrame(data)
    
    df['salesperson'] = df['first_name'] + " " + df['last_name']
    
    perf = []
    for name, group in df.groupby('salesperson'):
        assigned = len(group)
        won = len(group[group['status'] == LeadStatus.won])
        lost = len(group[group['status'] == LeadStatus.lost])
        win_rate = (won / assigned * 100) if assigned > 0 else 0
        
        won_group = group[group['status'] == LeadStatus.won].copy()
        avg_turnaround = 0
        if not won_group.empty:
            won_group['turnaround'] = (pd.to_datetime(won_group['won_at']) - pd.to_datetime(won_group['created_at'])).dt.days
            avg_turnaround = won_group['turnaround'].mean()

        total_value = float(group['estimated_value'].sum()) if not pd.isna(group['estimated_value'].sum()) else 0
            
        perf.append({
            "salesperson": name,
            "leads_assigned": assigned,
            "leads_won": won,
            "leads_lost": lost,
            "win_rate": round(win_rate, 1),
            "avg_turnaround": round(float(avg_turnaround), 1) if not pd.isna(avg_turnaround) else 0,
            "total_value": total_value
        })
        
    return sorted(perf, key=lambda x: x['leads_won'], reverse=True)

def get_monthly_trend(db: Session, division_id: Optional[Any] = None, months: int = 6) -> List[Dict[str, Any]]:
    cutoff_date = datetime.now(timezone.utc) - timedelta(days=months*30)
    query = db.query(Lead).filter(and_(Lead.is_deleted == False, Lead.created_at >= cutoff_date))
    if division_id:
        query = query.filter(Lead.division_id == division_id)
        
    leads = query.all()
    leads_data = []
    for lead in leads:
        lead_dict = {col.name: getattr(lead, col.name) for col in lead.__table__.columns}
        leads_data.append(lead_dict)
    df = pd.DataFrame(leads_data)
    if df.empty:
        return []
    
    df['month'] = pd.to_datetime(df['created_at']).dt.strftime('%Y-%m')
    
    trends = []
    for month, group in df.groupby('month'):
        won_group = group[group['status'] == LeadStatus.won]
        pipeline_val = float(group['estimated_value'].sum()) if not pd.isna(group['estimated_value'].sum()) else 0
        trends.append({
            "month": month,
            "total_leads": len(group),
            "won_leads": len(won_group),
            "pipeline_value": pipeline_val
        })
        
    return sorted(trends, key=lambda x: x['month'])

# ─────────────────────────── NEW ANALYTICS FUNCTIONS ───────────────────────────

def get_industry_breakdown(db: Session, division_id: Optional[Any] = None) -> List[Dict[str, Any]]:
    """Returns lead counts and pipeline value broken down by industry."""
    query = db.query(Lead).filter(Lead.is_deleted == False)
    if division_id:
        query = query.filter(Lead.division_id == division_id)
    leads = query.all()
    leads_data = []
    for lead in leads:
        lead_dict = {col.name: getattr(lead, col.name) for col in lead.__table__.columns}
        leads_data.append(lead_dict)
    df = pd.DataFrame(leads_data)
    if df.empty:
        return []
    
    df['industry'] = df['industry'].fillna('Unknown')
    df['estimated_value'] = pd.to_numeric(df['estimated_value'], errors='coerce').fillna(0)
    
    result = []
    for industry, group in df.groupby('industry'):
        if not industry or str(industry).strip() == '':
            industry = 'Unknown'
        won = len(group[group['status'] == LeadStatus.won])
        total = len(group)
        result.append({
            "industry": str(industry),
            "count": total,
            "won_leads": won,
            "win_rate": round((won / total * 100), 1) if total > 0 else 0,
            "pipeline_value": round(float(group['estimated_value'].sum()), 2)
        })
    return sorted(result, key=lambda x: x['count'], reverse=True)[:10]

def get_country_breakdown(db: Session, division_id: Optional[Any] = None) -> List[Dict[str, Any]]:
    """Returns lead counts broken down by country."""
    query = db.query(Lead).filter(Lead.is_deleted == False)
    if division_id:
        query = query.filter(Lead.division_id == division_id)
    leads = query.all()
    leads_data = []
    for lead in leads:
        lead_dict = {col.name: getattr(lead, col.name) for col in lead.__table__.columns}
        leads_data.append(lead_dict)
    df = pd.DataFrame(leads_data)
    if df.empty:
        return []

    df['country'] = df['country'].fillna('Unknown')
    df['estimated_value'] = pd.to_numeric(df['estimated_value'], errors='coerce').fillna(0)

    result = []
    for country, group in df.groupby('country'):
        if not country or str(country).strip() == '':
            country = 'Unknown'
        won = len(group[group['status'] == LeadStatus.won])
        total = len(group)
        result.append({
            "country": str(country),
            "count": total,
            "won_leads": won,
            "pipeline_value": round(float(group['estimated_value'].sum()), 2)
        })
    return sorted(result, key=lambda x: x['count'], reverse=True)[:15]

def get_source_revenue(db: Session, division_id: Optional[Any] = None) -> List[Dict[str, Any]]:
    """Returns lead counts and pipeline value broken down by source."""
    query = db.query(Lead).filter(Lead.is_deleted == False)
    if division_id:
        query = query.filter(Lead.division_id == division_id)
    leads = query.all()
    leads_data = []
    for lead in leads:
        lead_dict = {col.name: getattr(lead, col.name) for col in lead.__table__.columns}
        leads_data.append(lead_dict)
    df = pd.DataFrame(leads_data)
    if df.empty:
        return []

    df['source'] = df['source'].fillna('other')
    df['estimated_value'] = pd.to_numeric(df['estimated_value'], errors='coerce').fillna(0)

    result = []
    for source, group in df.groupby('source'):
        won = len(group[group['status'] == LeadStatus.won])
        total = len(group)
        result.append({
            "source": str(source).replace('_', ' ').title(),
            "count": total,
            "won_leads": won,
            "win_rate": round((won / total * 100), 1) if total > 0 else 0,
            "pipeline_value": round(float(group['estimated_value'].sum()), 2)
        })
    return sorted(result, key=lambda x: x['pipeline_value'], reverse=True)

def get_top_companies(db: Session, division_id: Optional[Any] = None, limit: int = 10) -> List[Dict[str, Any]]:
    """Returns top companies by estimated pipeline value."""
    query = db.query(Lead).filter(Lead.is_deleted == False)
    if division_id:
        query = query.filter(Lead.division_id == division_id)
    leads = query.all()
    leads_data = []
    for lead in leads:
        lead_dict = {col.name: getattr(lead, col.name) for col in lead.__table__.columns}
        leads_data.append(lead_dict)
    df = pd.DataFrame(leads_data)
    if df.empty:
        return []

    df['company_name'] = df['company_name'].fillna('Unknown')
    df['estimated_value'] = pd.to_numeric(df['estimated_value'], errors='coerce').fillna(0)

    result = []
    for company, group in df.groupby('company_name'):
        if not company or str(company).strip() == '':
            continue
        statuses = group['status'].tolist()
        has_won = LeadStatus.won in statuses or 'won' in statuses
        result.append({
            "company": str(company),
            "lead_count": len(group),
            "pipeline_value": round(float(group['estimated_value'].sum()), 2),
            "status": "Won" if has_won else str(group['status'].mode()[0]).replace('_', ' ').title(),
            "industry": str(group['industry'].mode()[0]) if not group['industry'].mode().empty else "Unknown"
        })
    return sorted(result, key=lambda x: x['pipeline_value'], reverse=True)[:limit]

def get_lead_score_distribution(db: Session, division_id: Optional[Any] = None) -> List[Dict[str, Any]]:
    """Returns lead score distribution in buckets."""
    query = db.query(Lead).filter(Lead.is_deleted == False)
    if division_id:
        query = query.filter(Lead.division_id == division_id)
    leads = query.all()
    leads_data = []
    for lead in leads:
        lead_dict = {col.name: getattr(lead, col.name) for col in lead.__table__.columns}
        leads_data.append(lead_dict)
    df = pd.DataFrame(leads_data)
    if df.empty:
        return []

    df['lead_score'] = pd.to_numeric(df['lead_score'], errors='coerce').fillna(0)

    buckets = [
        ("Cold (0-20)", 0, 20),
        ("Warm (21-40)", 21, 40),
        ("Hot (41-60)", 41, 60),
        ("Very Hot (61-80)", 61, 80),
        ("Champion (81-100)", 81, 100),
    ]

    result = []
    for label, low, high in buckets:
        bucket_df = df[(df['lead_score'] >= low) & (df['lead_score'] <= high)]
        result.append({
            "bucket": label,
            "count": len(bucket_df),
            "won": len(bucket_df[bucket_df['status'] == LeadStatus.won])
        })
    return result

def get_combined_analytics(db: Session, division_id: Optional[Any] = None, months: int = 6) -> Dict[str, Any]:
    """Single combined endpoint to reduce HTTP round trips."""
    return {
        "dashboard": get_dashboard_stats(db, division_id),
        "funnel": get_conversion_funnel(db, division_id),
        "monthly_trends": get_monthly_trend(db, division_id, months),
        "performance": get_salesperson_performance(db, division_id),
        "industry": get_industry_breakdown(db, division_id),
        "country": get_country_breakdown(db, division_id),
        "source_revenue": get_source_revenue(db, division_id),
        "top_companies": get_top_companies(db, division_id),
        "score_distribution": get_lead_score_distribution(db, division_id),
        "turnaround": get_turnaround_report(db, division_id).to_dict(orient="records")
    }

def export_leads_excel(db: Session, filters: Dict[str, Any]) -> io.BytesIO:
    query = db.query(Lead).filter(Lead.is_deleted == False)
    if filters.get('division_id'):
        query = query.filter(Lead.division_id == filters['division_id'])
    
    leads = query.all()
    leads_data = []
    for lead in leads:
        lead_dict = {col.name: getattr(lead, col.name) for col in lead.__table__.columns}
        leads_data.append(lead_dict)
    df = pd.DataFrame(leads_data)
    if df.empty:
        df = pd.DataFrame(columns=[col.name for col in Lead.__table__.columns])
    
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

        # Sheet 4: Industry Breakdown
        industry_data = get_industry_breakdown(db, filters.get('division_id'))
        if industry_data:
            pd.DataFrame(industry_data).to_excel(writer, sheet_name='Industry Breakdown', index=False)

        # Sheet 5: Country Breakdown
        country_data = get_country_breakdown(db, filters.get('division_id'))
        if country_data:
            pd.DataFrame(country_data).to_excel(writer, sheet_name='Country Breakdown', index=False)
        
        # Formatting
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
