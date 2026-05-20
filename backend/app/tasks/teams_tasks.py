import logging
import asyncio
from app.tasks.celery_app import celery_app
from app.core.database import SessionLocal
from app.services.teams_call_service import (
    fetch_recent_call_records,
    extract_participant_emails,
    match_call_to_lead,
    download_recording,
    store_recording
)

logger = logging.getLogger(__name__)

@celery_app.task
def capture_teams_recordings():
    db = SessionLocal()
    success = 0
    skipped = 0
    
    try:
        records = asyncio.run(fetch_recent_call_records())
        
        for call_record in records:
            call_id = call_record.get('id', 'unknown')
            try:
                emails = extract_participant_emails(call_record)
                lead_id = asyncio.run(match_call_to_lead(db, emails))
                
                if not lead_id:
                    logger.warning(f"No matching lead for call {call_id}, skipping")
                    skipped += 1
                    continue
                    
                logger.info(f"Matched call {call_id} to lead {lead_id}")
                
                recording_bytes = asyncio.run(download_recording(call_record))
                
                if not recording_bytes:
                    logger.warning(f"No recording found for call {call_id}, skipping")
                    skipped += 1
                    continue
                    
                asyncio.run(store_recording(db, call_record, lead_id, recording_bytes))
                success += 1
                
            except Exception as e:
                logger.error(f"Failed to process call {call_id}: {e}")
                skipped += 1
                
        logger.info(f"Pipeline complete. Stored: {success}, Skipped: {skipped}")
    finally:
        db.close()
