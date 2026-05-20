import csv
import io
from typing import List, Optional
from uuid import UUID
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import select, desc, and_
from app.models.audit_log import AuditLog
from app.models.user import User

def list_audit_logs(
    db: Session,
    user_id: Optional[UUID] = None,
    action: Optional[str] = None,
    entity_type: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    skip: int = 0,
    limit: int = 100
):
    query = select(AuditLog, User.email).outerjoin(User, AuditLog.user_id == User.id)
    
    filters = []
    if user_id:
        filters.append(AuditLog.user_id == user_id)
    if action:
        filters.append(AuditLog.action == action)
    if entity_type:
        filters.append(AuditLog.entity_type == entity_type)
    if start_date:
        filters.append(AuditLog.created_at >= start_date)
    if end_date:
        filters.append(AuditLog.created_at <= end_date)
        
    if filters:
        query = query.where(and_(*filters))
        
    query = query.order_by(desc(AuditLog.created_at)).offset(skip).limit(limit)
    
    results = db.execute(query).all()
    
    output = []
    for log, email in results:
        log_dict = {
            "id": log.id,
            "user_id": log.user_id,
            "user_email": email,
            "action": log.action,
            "entity_type": log.entity_type,
            "entity_id": log.entity_id,
            "old_value": log.old_value,
            "new_value": log.new_value,
            "ip_address": log.ip_address,
            "created_at": log.created_at
        }
        output.append(log_dict)
        
    return output

def count_audit_logs(
    db: Session,
    user_id: Optional[UUID] = None,
    action: Optional[str] = None,
    entity_type: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None
):
    query = select(AuditLog)
    
    filters = []
    if user_id:
        filters.append(AuditLog.user_id == user_id)
    if action:
        filters.append(AuditLog.action == action)
    if entity_type:
        filters.append(AuditLog.entity_type == entity_type)
    if start_date:
        filters.append(AuditLog.created_at >= start_date)
    if end_date:
        filters.append(AuditLog.created_at <= end_date)
        
    if filters:
        query = query.where(and_(*filters))
        
    return db.query(AuditLog).filter(*filters).count() if filters else db.query(AuditLog).count()

def generate_audit_log_csv(db: Session, filters_dict: dict):
    query = select(AuditLog, User.email).outerjoin(User, AuditLog.user_id == User.id)
    
    filters = []
    if filters_dict.get("user_id"):
        filters.append(AuditLog.user_id == filters_dict["user_id"])
    if filters_dict.get("action"):
        filters.append(AuditLog.action == filters_dict["action"])
    if filters_dict.get("entity_type"):
        filters.append(AuditLog.entity_type == filters_dict["entity_type"])
    if filters_dict.get("start_date"):
        filters.append(AuditLog.created_at >= filters_dict["start_date"])
    if filters_dict.get("end_date"):
        filters.append(AuditLog.created_at <= filters_dict["end_date"])
        
    if filters:
        query = query.where(and_(*filters))
        
    query = query.order_by(desc(AuditLog.created_at))
    
    # We use a generator for StreamingResponse
    def iterate_logs():
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Header
        writer.writerow(["Timestamp", "User Email", "Action", "Entity Type", "Entity ID", "IP Address"])
        yield output.getvalue()
        output.seek(0)
        output.truncate(0)
        
        # Data
        results = db.execute(query).all()
        for log, email in results:
            writer.writerow([
                log.created_at.strftime("%Y-%m-%d %H:%M:%S"),
                email or "System",
                log.action,
                log.entity_type,
                log.entity_id,
                log.ip_address or "N/A"
            ])
            yield output.getvalue()
            output.seek(0)
            output.truncate(0)

    return iterate_logs()
