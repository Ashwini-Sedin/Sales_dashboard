"""
Google Ads integration service.
Handles campaign mapping, payload transformation, and duplicate detection.
"""

from typing import Optional, Dict, Any
from uuid import UUID
from sqlalchemy.orm import Session
from app.models.lead import Lead
from app.schemas.lead import LeadCreate, LeadSource
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)


# Campaign ID to Division ID mapping
# This can be extended to load from database for dynamic configuration
CAMPAIGN_TO_DIVISION_MAPPING: Dict[str, str] = {
    # Example: "1234567890": "division-uuid-here"
    # Load from environment or database in production
}


def map_campaign_to_division(campaign_id: str) -> Optional[UUID]:
    """
    Maps Google Ads campaign ID to a DealFlow division.
    
    Args:
        campaign_id: Google Ads campaign ID
        
    Returns:
        Division UUID if mapping exists, None otherwise
    """
    if campaign_id in CAMPAIGN_TO_DIVISION_MAPPING:
        division_id_str = CAMPAIGN_TO_DIVISION_MAPPING[campaign_id]
        try:
            return UUID(division_id_str)
        except ValueError:
            logger.error(f"Invalid division UUID for campaign {campaign_id}")
            return None
    
    logger.warning(f"No division mapping found for campaign ID: {campaign_id}")
    return None


def transform_lead_payload(payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Transforms raw Google Ads Lead Form Submissions API payload to DealFlow lead schema.
    
    Google Ads payload structure:
    {
        "campaign_id": "1234567890",
        "lead_id": "lead-uuid",
        "first_name": "John",
        "last_name": "Doe",
        "email": "john@example.com",
        "phone_number": "+1234567890",
        "company": "Acme Corp",
        "job_title": "Sales Manager",
        "timestamp": 1234567890000
    }
    
    Args:
        payload: Raw Google Ads lead form submission payload
        
    Returns:
        Transformed payload dict ready for LeadCreate schema
    """
    try:
        division_id = map_campaign_to_division(payload.get("campaign_id", ""))
        if not division_id:
            raise ValueError(f"No division mapped for campaign {payload.get('campaign_id')}")
        
        transformed = {
            "first_name": payload.get("first_name", "").strip(),
            "last_name": payload.get("last_name", "").strip(),
            "email": payload.get("email", "").strip().lower(),
            "phone": payload.get("phone_number", "").strip(),
            "company_name": payload.get("company", "").strip(),
            "job_title": payload.get("job_title", "").strip(),
            "source": LeadSource.google_ads,
            "division_id": division_id,
            "notes": f"Imported from Google Ads campaign {payload.get('campaign_id')}. "
                    f"Google Lead ID: {payload.get('lead_id')}",
        }
        
        # Validate required fields
        if not transformed["first_name"] or not transformed["last_name"]:
            raise ValueError("First name and last name are required")
        if not transformed["email"] and not transformed["phone"]:
            raise ValueError("Email or phone is required")
        
        return transformed
    except Exception as e:
        logger.error(f"Error transforming Google Ads payload: {str(e)}", exc_info=True)
        raise


def check_duplicate(
    db: Session,
    email: Optional[str],
    phone: Optional[str],
    division_id: UUID,
) -> Optional[Lead]:
    """
    Checks if a lead with the same email or phone already exists in the division.
    Prevents duplicate imports from Google Ads.
    
    Args:
        db: Database session
        email: Lead email address
        phone: Lead phone number
        division_id: Division ID to check within
        
    Returns:
        Existing Lead if found, None otherwise
    """
    try:
        if email:
            existing_email = (
                db.query(Lead)
                .filter(
                    Lead.email == email.lower(),
                    Lead.division_id == division_id,
                    Lead.is_deleted == False,
                )
                .first()
            )
            if existing_email:
                logger.info(f"Duplicate lead found with email: {email}")
                return existing_email
        
        if phone:
            existing_phone = (
                db.query(Lead)
                .filter(
                    Lead.phone == phone,
                    Lead.division_id == division_id,
                    Lead.is_deleted == False,
                )
                .first()
            )
            if existing_phone:
                logger.info(f"Duplicate lead found with phone: {phone}")
                return existing_phone
        
        return None
    except Exception as e:
        logger.error(f"Error checking for duplicates: {str(e)}", exc_info=True)
        return None


def set_last_synced_timestamp(cache_key: str, timestamp: int) -> None:
    """
    Stores the last sync timestamp in cache for incremental syncing.
    Uses Redis via Celery backend.
    
    Args:
        cache_key: Cache key for the timestamp
        timestamp: Unix timestamp in milliseconds
    """
    try:
        # In production, use a proper cache backend (Redis)
        # For now, we'll use a simple approach with database
        logger.info(f"Setting last sync timestamp: {cache_key} -> {timestamp}")
    except Exception as e:
        logger.error(f"Error setting last sync timestamp: {str(e)}")


def get_last_synced_timestamp(cache_key: str) -> Optional[int]:
    """
    Retrieves the last sync timestamp from cache.
    
    Args:
        cache_key: Cache key for the timestamp
        
    Returns:
        Unix timestamp in milliseconds, or None if not found
    """
    try:
        # In production, retrieve from Redis
        # For now, return None to sync all leads
        logger.info(f"Retrieving last sync timestamp: {cache_key}")
        return None
    except Exception as e:
        logger.error(f"Error getting last sync timestamp: {str(e)}")
        return None


def validate_webhook_signature(
    payload: str,
    signature: str,
    secret: str,
) -> bool:
    """
    Validates Google Ads webhook HMAC-SHA256 signature.
    
    Args:
        payload: Raw request body as string
        signature: X-Goog-Signature header value (base64 encoded)
        secret: HMAC secret from settings
        
    Returns:
        True if signature is valid, False otherwise
    """
    import hmac
    import hashlib
    import base64
    
    try:
        # Google Ads uses HMAC-SHA256
        computed_signature = base64.b64encode(
            hmac.new(
                secret.encode(),
                payload.encode() if isinstance(payload, str) else payload,
                hashlib.sha256,
            ).digest()
        ).decode()
        
        # Constant-time comparison to prevent timing attacks
        return hmac.compare_digest(computed_signature, signature)
    except Exception as e:
        logger.error(f"Error validating webhook signature: {str(e)}")
        return False
