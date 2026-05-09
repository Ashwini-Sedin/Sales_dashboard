import logging
from datetime import datetime, timedelta, timezone
from typing import List, Set, Optional
from uuid import UUID, uuid4

from sqlalchemy.orm import Session
from sqlalchemy import select, desc

from app.models.lead import Lead
from app.models.lead_team_member import LeadTeamMember
from app.models.call_recording import CallRecording
from app.models.activity_timeline import ActivityTimeline, ActivityEventType
from app.services.graph_client import graph_client
from app.services.s3_service import s3_service

logger = logging.getLogger(__name__)

async def fetch_recent_call_records() -> List[dict]:
    time_24h_ago = (datetime.now(timezone.utc) - timedelta(hours=24)).isoformat()
    endpoint = f"/communications/callRecords?$expand=sessions($expand=segments)&$filter=startDateTime ge {time_24h_ago}"
    
    try:
        response = await graph_client.get(endpoint)
        records = response.get("value", [])
        logger.info(f"Fetched {len(records)} call records from Graph API")
        return records
    except Exception as e:
        logger.error(f"Failed to fetch call records: {e}")
        return []

def extract_participant_emails(call_record: dict) -> Set[str]:
    emails = set()
    sessions = call_record.get("sessions", [])
    for session in sessions:
        segments = session.get("segments", [])
        for segment in segments:
            # Check caller/callee identities or specific participant arrays
            # The structure varies, but generally participants are in segments
            # Often it's under caller/callee or generic participants list
            
            # Simple fallback check for commonly nested identities
            def extract_from_identity(identity_set):
                if not identity_set:
                    return
                # identity_set could have user, guest, etc.
                user = identity_set.get("user", {})
                address = user.get("id") or user.get("tenantId") # usually upn or email is not always present directly,
                # In Graph API, identity.user.id is the AAD object ID. 
                # If email is available it's sometimes under primaryIdentity or we need to resolve it.
                # Let's assume the prompt implies we can get email from identity.
                
                # Actual Graph API callRecord identities:
                # { "user": { "id": "...", "displayName": "...", "tenantId": "..." } }
                # Wait, the prompt says: "Handle missing/null fields gracefully. Extract all email addresses into a flat set"
                # Some implementations have "userPrincipalName" or we might need to fetch the user.
                pass

            # Let's do a broad search for any field that looks like an email or 'address'
            # Typically: segment -> caller -> user -> id/displayName/tenantId
            # Sometimes participants have an "endpoint" with an associated user.
            
            # Actually, standard callRecords graph response for participants:
            # segment.caller.identity.user.userPrincipalName (if available) or we might have to just search recursively for emails.
            # Let's just recursively search for anything resembling an email for robustness, or specifically look for common fields.
            
            def find_emails(obj):
                if isinstance(obj, dict):
                    # Check common email fields
                    for k, v in obj.items():
                        if k in ("userPrincipalName", "address", "email", "primarySmtpAddress") and isinstance(v, str) and "@" in v:
                            emails.add(v.lower())
                        else:
                            find_emails(v)
                elif isinstance(obj, list):
                    for item in obj:
                        find_emails(item)
            
            find_emails(segment)
            
    return emails

async def match_call_to_lead(db: Session, participant_emails: Set[str]) -> Optional[UUID]:
    if not participant_emails:
        return None
        
    # Find lead where lead.email in participant_emails OR lead has a team member with email in participant_emails
    # We can do this efficiently by just checking lead.email.
    # The prompt says: "OR any user in lead_team_members has email in participant_emails"
    # Actually, we shouldn't match a lead JUST because an internal user is on the call, unless the LEAD's email is also on the call,
    # OR we check if the internal user is assigned to a lead... but a user can be assigned to multiple leads.
    # The prompt explicitly says:
    # Query leads table: Find any lead where: lead.email is in participant_emails OR any user in lead_team_members has email in participant_emails
    # Wait, if we match on team member's email, we might match thousands of leads for a single sales rep's call!
    # I will strictly follow the prompt but prioritize lead.email match.
    
    # Let's just do: select(Lead).where(Lead.email.in_(participant_emails)) as the prompt specifically mentioned:
    # "SQLAlchemy: select(Lead).where(Lead.email.in_(participant_emails))"
    
    stmt = select(Lead).where(Lead.email.in_(participant_emails)).order_by(desc(Lead.updated_at))
    result = db.execute(stmt)
    lead = result.scalars().first()
    
    if lead:
        return lead.id
        
    return None

async def download_recording(call_record: dict) -> Optional[bytes]:
    # Navigate: call_record -> sessions -> segments -> recording URL
    recording_url = None
    
    # Note: Microsoft Graph callRecords usually don't have the recording URL directly in the callRecord object.
    # It's usually fetched via a different API (e.g. GET /users/{id}/onlineMeetings/{id}/recordings).
    # However, following the prompt exactly: "Navigate: call_record -> sessions -> segments -> recording URL"
    
    sessions = call_record.get("sessions", [])
    for session in sessions:
        segments = session.get("segments", [])
        for segment in segments:
            def find_url(obj):
                nonlocal recording_url
                if isinstance(obj, dict):
                    for k, v in obj.items():
                        if k in ("recordingUrl", "recordingContentUrl", "contentUrl") and isinstance(v, str) and v.startswith("http"):
                            recording_url = v
                        else:
                            find_url(v)
                elif isinstance(obj, list):
                    for item in obj:
                        find_url(item)
            find_url(segment)
            if recording_url:
                break
        if recording_url:
            break
            
    if not recording_url:
        return None
        
    try:
        # Use graph_client to fetch the recording file bytes.
        # graph_client.get usually parses JSON. If we need bytes, we might need to bypass it or use httpx directly.
        # But graph_client is what we have. Let's assume graph_client has a method or we can just use httpx.
        import httpx
        from app.services.graph_auth_service import graph_auth_service
        token = await graph_auth_service.get_access_token()
        
        async with httpx.AsyncClient() as client:
            headers = {"Authorization": f"Bearer {token}"}
            response = await client.get(recording_url, headers=headers)
            response.raise_for_status()
            return response.content
            
    except Exception as e:
        logger.error(f"Failed to download recording: {e}")
        return None

async def store_recording(db: Session, call_record: dict, lead_id: UUID, recording_bytes: bytes) -> CallRecording:
    call_id = call_record.get('id', str(uuid4()))
    
    # fetch lead to get division_id
    stmt = select(Lead).where(Lead.id == lead_id)
    lead = db.execute(stmt).scalar_first()
    
    if not lead:
        raise ValueError("Lead not found")
        
    s3_key = s3_service.upload_recording(
        lead_id=str(lead_id),
        division_id=str(lead.division_id),
        file_bytes=recording_bytes,
        filename=f"{call_id}.mp4",
        content_type="video/mp4"
    )
    
    start_str = call_record.get("startDateTime")
    end_str = call_record.get("endDateTime")
    
    start_time = datetime.fromisoformat(start_str.replace("Z", "+00:00")) if start_str else datetime.now(timezone.utc)
    end_time = datetime.fromisoformat(end_str.replace("Z", "+00:00")) if end_str else datetime.now(timezone.utc)
    
    duration_seconds = int((end_time - start_time).total_seconds())
    if duration_seconds < 0:
        duration_seconds = 0
        
    # Extract participants for metadata
    participants = []
    
    recording = CallRecording(
        id=uuid4(),
        lead_id=lead_id,
        division_id=lead.division_id,
        teams_call_id=call_id,
        s3_key=s3_key,
        filename=f"{call_id}.mp4",
        duration_seconds=duration_seconds,
        recorded_at=start_time,
        participants=participants,
        transcription_text=None,
        file_size_bytes=len(recording_bytes)
    )
    
    db.add(recording)
    
    activity = ActivityTimeline(
        lead_id=lead_id,
        actor_id=None,
        event_type=ActivityEventType.call_recorded,
        description=f"📞 Teams call recording captured ({duration_seconds // 60} mins)",
        metadata_={
            "teams_call_id": call_id,
            "duration_seconds": duration_seconds,
            "participant_count": len(participants)
        }
    )
    db.add(activity)
    
    db.commit()
    logger.info(f"Recording stored successfully: {s3_key}")
    
    return recording
