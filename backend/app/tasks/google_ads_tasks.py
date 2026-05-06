"""
Celery tasks for Google Ads lead synchronization.
Handles periodic polling and webhook-triggered lead processing.
"""

import logging
from typing import Dict, Any, Optional
from uuid import UUID
from app.tasks.celery_app import celery_app
from app.core.config import settings
from app.core.database import SessionLocal
from app.services import lead_service, google_ads_service
from app.schemas.lead import LeadCreate
from app.models.lead import LeadStatus

logger = logging.getLogger(__name__)


@celery_app.task(
    bind=True,
    name="app.tasks.google_ads_tasks.sync_google_ads_leads",
    max_retries=3,
    default_retry_delay=300,  # Retry after 5 minutes
)
def sync_google_ads_leads(self) -> Dict[str, Any]:
    """
    Periodic task that syncs leads from Google Ads Lead Form Submissions API.
    Runs every 15 minutes (configurable via settings.GOOGLE_ADS_SYNC_INTERVAL_MINUTES).
    
    This task:
    1. Connects to Google Ads API
    2. Polls for new lead form submissions since lastSyncedAt
    3. Transforms payloads using google_ads_service.transform_lead_payload()
    4. Checks for duplicates with google_ads_service.check_duplicate()
    5. Creates non-duplicate leads via lead_service.create_lead()
    6. Updates lastSyncedAt timestamp
    
    Returns:
        Dict with sync statistics (total_fetched, created, skipped, errors)
    """
    db = None
    try:
        db = SessionLocal()
        logger.info("Starting Google Ads lead synchronization task")
        
        # Validate configuration
        if not settings.GOOGLE_ADS_CUSTOMER_ID:
            logger.error("GOOGLE_ADS_CUSTOMER_ID not configured")
            return {"status": "error", "message": "Google Ads customer ID not configured"}
        
        if not settings.GOOGLE_ADS_DEVELOPER_TOKEN or not settings.GOOGLE_ADS_API_KEY:
            logger.error("Google Ads API credentials not configured")
            return {"status": "error", "message": "Google Ads API credentials not configured"}
        
        # Statistics tracking
        stats = {
            "total_fetched": 0,
            "created": 0,
            "skipped_duplicates": 0,
            "skipped_invalid": 0,
            "errors": 0,
        }
        
        # Get last sync timestamp for incremental sync
        cache_key = f"google_ads_sync:last_timestamp"
        last_sync_timestamp = google_ads_service.get_last_synced_timestamp(cache_key)
        
        # Mock implementation: In production, call Google Ads API here
        # For demonstration, we'll show the structure
        # leads = fetch_google_ads_leads(
        #     customer_id=settings.GOOGLE_ADS_CUSTOMER_ID,
        #     developer_token=settings.GOOGLE_ADS_DEVELOPER_TOKEN,
        #     api_key=settings.GOOGLE_ADS_API_KEY,
        #     since_timestamp=last_sync_timestamp,
        # )
        
        leads = []  # Placeholder for API response
        stats["total_fetched"] = len(leads)
        
        for lead_payload in leads:
            try:
                # Transform payload
                transformed_lead = google_ads_service.transform_lead_payload(lead_payload)
                
                # Check for duplicates
                division_id = transformed_lead["division_id"]
                duplicate = google_ads_service.check_duplicate(
                    db,
                    email=transformed_lead.get("email"),
                    phone=transformed_lead.get("phone"),
                    division_id=division_id,
                )
                
                if duplicate:
                    logger.info(
                        f"Skipping duplicate lead: {transformed_lead.get('email')} "
                        f"(existing lead: {duplicate.id})"
                    )
                    stats["skipped_duplicates"] += 1
                    continue
                
                # Create lead
                lead_create = LeadCreate(**transformed_lead)
                created_lead = lead_service.create_lead(
                    db,
                    lead_create,
                    creator_id=None,  # System-created lead
                )
                
                logger.info(f"Created lead from Google Ads: {created_lead.id}")
                stats["created"] += 1
                
            except ValueError as e:
                logger.warning(f"Invalid lead payload: {str(e)}")
                stats["skipped_invalid"] += 1
            except Exception as e:
                logger.error(f"Error processing Google Ads lead: {str(e)}", exc_info=True)
                stats["errors"] += 1
        
        # Update last sync timestamp
        import time
        current_timestamp = int(time.time() * 1000)  # Milliseconds
        google_ads_service.set_last_synced_timestamp(cache_key, current_timestamp)
        
        logger.info(f"Google Ads sync completed: {stats}")
        return {"status": "success", "stats": stats}
        
    except Exception as e:
        logger.error(f"Google Ads sync task failed: {str(e)}", exc_info=True)
        
        # Retry with exponential backoff
        try:
            raise self.retry(exc=e)
        except Exception:
            return {
                "status": "error",
                "message": str(e),
                "retry_count": self.request.retries,
            }
    finally:
        if db:
            db.close()


@celery_app.task(
    bind=True,
    name="app.tasks.google_ads_tasks.process_webhook_lead",
    max_retries=3,
    default_retry_delay=60,  # Retry after 1 minute
)
def process_webhook_lead(self, lead_payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Processes a lead received via Google Ads webhook.
    Enqueued by POST /api/integrations/google-ads/webhook endpoint.
    
    This task:
    1. Validates and transforms the payload
    2. Checks for duplicates
    3. Creates the lead if not duplicate
    4. Returns success/error response
    
    Args:
        lead_payload: Google Ads lead form submission payload
        
    Returns:
        Dict with status (success/error) and lead ID if created
    """
    db = None
    try:
        db = SessionLocal()
        logger.info("Processing Google Ads webhook lead")
        
        # Transform payload
        transformed_lead = google_ads_service.transform_lead_payload(lead_payload)
        division_id = transformed_lead["division_id"]
        
        # Check for duplicates
        duplicate = google_ads_service.check_duplicate(
            db,
            email=transformed_lead.get("email"),
            phone=transformed_lead.get("phone"),
            division_id=division_id,
        )
        
        if duplicate:
            logger.info(
                f"Webhook lead is duplicate: {transformed_lead.get('email')} "
                f"(existing lead: {duplicate.id})"
            )
            return {
                "status": "skipped",
                "message": "Duplicate lead",
                "existing_lead_id": str(duplicate.id),
            }
        
        # Create lead
        lead_create = LeadCreate(**transformed_lead)
        created_lead = lead_service.create_lead(
            db,
            lead_create,
            creator_id=None,  # System-created from webhook
        )
        
        logger.info(f"Created lead from webhook: {created_lead.id}")
        return {
            "status": "success",
            "lead_id": str(created_lead.id),
            "email": created_lead.email,
        }
        
    except ValueError as e:
        logger.warning(f"Invalid webhook payload: {str(e)}")
        return {"status": "error", "message": str(e)}
    except Exception as e:
        logger.error(f"Error processing webhook lead: {str(e)}", exc_info=True)
        
        # Retry with exponential backoff
        try:
            raise self.retry(exc=e)
        except Exception:
            return {
                "status": "error",
                "message": str(e),
                "retry_count": self.request.retries,
            }
    finally:
        if db:
            db.close()
