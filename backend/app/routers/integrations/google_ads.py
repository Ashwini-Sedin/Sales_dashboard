"""
Google Ads integrations API routes.
Handles webhook ingestion, manual syncs, and testing.
"""

import json
import logging
from typing import Dict, Any
from fastapi import APIRouter, HTTPException, status, Request, Depends
from app.core.config import settings
from app.services import google_ads_service
from app.tasks.google_ads_tasks import (
    sync_google_ads_leads,
    process_webhook_lead,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/integrations/google-ads", tags=["google-ads-integrations"])


@router.post("/webhook")
async def receive_google_ads_webhook(request: Request) -> Dict[str, Any]:
    """
    Webhook endpoint to receive Google Ads lead form submissions.
    
    Validates HMAC-SHA256 signature from X-Goog-Signature header.
    Enqueues async Celery task to process lead.
    Returns 200 immediately for async processing.
    
    Headers:
        X-Goog-Signature: HMAC-SHA256 signature (base64 encoded)
    
    Body:
        JSON payload with lead data:
        {
            "campaign_id": "1234567890",
            "lead_id": "abc123",
            "first_name": "John",
            "last_name": "Doe",
            "email": "john@example.com",
            "phone_number": "+1234567890",
            "company": "Acme Corp",
            "job_title": "Sales Manager"
        }
    
    Returns:
        200 OK with task_id for async tracking
    """
    try:
        # Validate webhook secret is configured
        if not settings.GOOGLE_ADS_WEBHOOK_SECRET:
            logger.error("GOOGLE_ADS_WEBHOOK_SECRET not configured")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Webhook not configured",
            )
        
        # Read raw body for signature validation
        body = await request.body()
        body_str = body.decode("utf-8")
        
        # Get signature from header
        signature = request.headers.get("X-Goog-Signature")
        if not signature:
            logger.warning("Missing X-Goog-Signature header")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Missing signature",
            )
        
        # Validate signature
        is_valid = google_ads_service.validate_webhook_signature(
            payload=body_str,
            signature=signature,
            secret=settings.GOOGLE_ADS_WEBHOOK_SECRET,
        )
        
        if not is_valid:
            logger.warning("Invalid webhook signature")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid signature",
            )
        
        # Parse payload
        try:
            payload = json.loads(body_str)
        except json.JSONDecodeError:
            logger.error("Invalid JSON payload")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid JSON",
            )
        
        # Enqueue async task
        task = process_webhook_lead.delay(payload)
        
        logger.info(f"Enqueued webhook lead processing task: {task.id}")
        
        return {
            "status": "accepted",
            "message": "Lead received and queued for processing",
            "task_id": task.id,
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing webhook: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process webhook",
        )


@router.post("/sync")
async def manual_sync_google_ads() -> Dict[str, Any]:
    """
    Manually trigger Google Ads lead synchronization.
    Polls the Google Ads API for new leads since last sync.
    
    Useful for:
    - One-time initial sync during setup
    - Manual retry if periodic task fails
    - Immediate sync after campaign changes
    
    Note: Periodic sync runs every 15 minutes automatically via Celery Beat.
    
    Returns:
        202 Accepted with task ID for async tracking
    """
    try:
        logger.info("Manual Google Ads sync triggered")
        
        # Enqueue sync task
        task = sync_google_ads_leads.delay()
        
        logger.info(f"Enqueued sync task: {task.id}")
        
        return {
            "status": "accepted",
            "message": "Sync task enqueued",
            "task_id": task.id,
        }
        
    except Exception as e:
        logger.error(f"Error triggering sync: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to trigger sync",
        )


@router.post("/test")
async def test_google_ads_webhook() -> Dict[str, Any]:
    """
    Test endpoint to validate webhook pipeline.
    Sends a mock Google Ads lead payload through the entire processing flow.
    
    Useful for:
    - Testing webhook signature validation
    - Verifying database connectivity
    - End-to-end pipeline testing during setup
    
    Returns:
        202 Accepted with task ID for async processing
    """
    try:
        logger.info("Google Ads webhook test initiated")
        
        # Mock Google Ads payload
        mock_payload = {
            "campaign_id": "1234567890",
            "lead_id": "test-lead-123",
            "first_name": "Test",
            "last_name": "User",
            "email": "test@example.com",
            "phone_number": "+1-555-0123",
            "company": "Test Corporation",
            "job_title": "Test Manager",
            "timestamp": 1234567890000,
        }
        
        # Enqueue task
        task = process_webhook_lead.delay(mock_payload)
        
        logger.info(f"Enqueued test task: {task.id}")
        
        return {
            "status": "accepted",
            "message": "Test payload sent for processing",
            "task_id": task.id,
            "mock_payload": mock_payload,
        }
        
    except Exception as e:
        logger.error(f"Error testing webhook: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to test webhook",
        )


@router.get("/status/{task_id}")
async def get_task_status(task_id: str) -> Dict[str, Any]:
    """
    Check the status of an async Celery task.
    Useful for monitoring webhook/sync operations.
    
    Args:
        task_id: Celery task ID from previous request
    
    Returns:
        Task status with result or error information
    """
    try:
        from app.tasks.celery_app import celery_app
        
        task_result = celery_app.AsyncResult(task_id)
        
        if task_result.state == "PENDING":
            return {
                "task_id": task_id,
                "status": "pending",
                "message": "Task is pending",
            }
        elif task_result.state == "SUCCESS":
            return {
                "task_id": task_id,
                "status": "success",
                "result": task_result.result,
            }
        elif task_result.state == "FAILURE":
            return {
                "task_id": task_id,
                "status": "failure",
                "error": str(task_result.info),
            }
        elif task_result.state == "RETRY":
            return {
                "task_id": task_id,
                "status": "retry",
                "message": "Task is retrying",
            }
        else:
            return {
                "task_id": task_id,
                "status": task_result.state,
                "result": task_result.result,
            }
            
    except Exception as e:
        logger.error(f"Error getting task status: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get task status",
        )
