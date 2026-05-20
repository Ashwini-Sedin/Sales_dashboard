# Google Ads Integration Setup & Usage Guide

## Overview

DealFlow integrates with Google Ads Lead Form Submissions API to automatically import leads into your system. The integration supports:

- **Webhook-based ingestion**: Real-time lead capture via Google Ads webhook
- **Periodic polling**: Automated sync every 15 minutes (configurable)
- **Duplicate detection**: Prevents importing the same lead twice
- **Campaign-to-division mapping**: Routes leads to the correct division
- **Async processing**: Uses Celery for non-blocking lead processing
- **Activity tracking**: Logs all integration events for auditing

## File Structure

```
backend/
├── app/
│   ├── core/
│   │   └── config.py (Google Ads settings)
│   ├── models/
│   │   └── integration_sync.py (Sync history tracking)
│   ├── schemas/
│   │   └── integration.py (Pydantic schemas)
│   ├── services/
│   │   └── google_ads_service.py (Business logic)
│   ├── routers/
│   │   └── integrations/
│   │       └── google_ads.py (API endpoints)
│   └── tasks/
│       ├── celery_app.py (Celery configuration)
│       └── google_ads_tasks.py (Async tasks)
└── .env.example (Configuration template)
```

## Configuration

### 1. Environment Variables

Add to your `.env` file (see `.env.example`):

```bash
# Google Ads API Credentials
GOOGLE_ADS_CUSTOMER_ID=1234567890
GOOGLE_ADS_DEVELOPER_TOKEN=your-developer-token
GOOGLE_ADS_API_KEY=your-api-key

# Webhook Security
GOOGLE_ADS_WEBHOOK_SECRET=your-webhook-secret

# Sync Interval (minutes)
GOOGLE_ADS_SYNC_INTERVAL_MINUTES=15
```

### 2. Campaign-to-Division Mapping

Edit `app/services/google_ads_service.py` and update the `CAMPAIGN_TO_DIVISION_MAPPING` dictionary:

```python
CAMPAIGN_TO_DIVISION_MAPPING: Dict[str, str] = {
    "1234567890": "550e8400-e29b-41d4-a716-446655440000",  # Sales Division
    "9876543210": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",  # Enterprise Division
}
```

Or load from database/config for dynamic mapping (recommended for production).

### 3. Starting Services

#### Start Celery Worker

```bash
celery -A app.tasks.celery_app worker --loglevel=info
```

#### Start Celery Beat (for periodic tasks)

```bash
celery -A app.tasks.celery_app beat --loglevel=info
```

#### Using Docker Compose

Already configured in `docker-compose.yml`:

```bash
docker-compose up
# This starts:
# - api (FastAPI server)
# - db (PostgreSQL)
# - redis
# - celery_worker
# - celery_beat (scheduled for every 15 minutes)
```

## API Endpoints

### 1. Webhook Ingestion

**POST** `/api/integrations/google-ads/webhook`

Receives lead form submissions from Google Ads. Validates HMAC-SHA256 signature.

**Headers:**
```
X-Goog-Signature: <base64-encoded-hmac-sha256-signature>
Content-Type: application/json
```

**Request Body:**
```json
{
  "campaign_id": "1234567890",
  "lead_id": "google-lead-id-123",
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "phone_number": "+1-555-0123",
  "company": "Acme Corp",
  "job_title": "Sales Manager",
  "timestamp": 1234567890000
}
```

**Response (202 Accepted):**
```json
{
  "status": "accepted",
  "message": "Lead received and queued for processing",
  "task_id": "celery-task-id-uuid"
}
```

### 2. Manual Sync Trigger

**POST** `/api/integrations/google-ads/sync`

Manually trigger a sync from Google Ads API. Useful for:
- Initial bulk import
- Recovery from failed syncs
- Immediate sync after campaign changes

**Response (202 Accepted):**
```json
{
  "status": "accepted",
  "message": "Sync task enqueued",
  "task_id": "celery-task-id-uuid"
}
```

### 3. Test Webhook

**POST** `/api/integrations/google-ads/test`

Send a mock Google Ads payload through the entire pipeline. Useful for testing during setup.

**Response (202 Accepted):**
```json
{
  "status": "accepted",
  "message": "Test payload sent for processing",
  "task_id": "celery-task-id-uuid",
  "mock_payload": {
    "campaign_id": "1234567890",
    "lead_id": "test-lead-123",
    "first_name": "Test",
    "last_name": "User",
    "email": "test@example.com",
    "phone_number": "+1-555-0123",
    "company": "Test Corporation",
    "job_title": "Test Manager"
  }
}
```

### 4. Task Status Check

**GET** `/api/integrations/google-ads/status/{task_id}`

Check the status of an async task.

**Response:**
```json
{
  "task_id": "celery-task-id-uuid",
  "status": "success",
  "result": {
    "status": "success",
    "stats": {
      "total_fetched": 50,
      "created": 48,
      "skipped_duplicates": 2,
      "skipped_invalid": 0,
      "errors": 0
    }
  }
}
```

## Workflow

### Webhook Flow

```
Google Ads Form Submission
        ↓
POST /api/integrations/google-ads/webhook
        ↓
Validate HMAC-SHA256 signature
        ↓
Parse JSON payload
        ↓
Enqueue Celery task: process_webhook_lead()
        ↓
Return 202 Accepted immediately
        ↓
[Async Processing]
        ↓
Transform payload (map campaign to division, validate fields)
        ↓
Check for duplicates (email + phone)
        ↓
Create lead in database
        ↓
Log activity event
        ↓
Task complete (success/error stored in Celery backend)
```

### Periodic Sync Flow

```
Celery Beat triggers every 15 minutes
        ↓
Celery task: sync_google_ads_leads()
        ↓
Connect to Google Ads API
        ↓
Poll for leads since lastSyncedAt
        ↓
For each lead:
  ├─ Transform payload
  ├─ Check duplicates
  ├─ Create if new
  └─ Log activity
        ↓
Update lastSyncedAt timestamp
        ↓
Log sync statistics
```

## Duplicate Detection

Leads are considered duplicates if they share:
- Same **email address** (case-insensitive) in the same division, OR
- Same **phone number** in the same division

Duplicate leads from webhooks are skipped and logged.

## Payload Transformation

Raw Google Ads payload is transformed to DealFlow LeadCreate schema:

```python
{
    "first_name": payload["first_name"],
    "last_name": payload["last_name"],
    "email": payload["email"].lower(),
    "phone": payload["phone_number"],
    "company_name": payload["company"],
    "job_title": payload["job_title"],
    "source": LeadSource.google_ads,  # Auto-set
    "division_id": mapped_division_id,
    "notes": f"Imported from Google Ads campaign {campaign_id}. "
             f"Google Lead ID: {lead_id}",
    "status": LeadStatus.new,  # Default
    "lead_score": 0,  # Default
}
```

## Logging & Monitoring

### Logs

Check logs for:

```bash
# Celery worker logs
docker logs dealflow-celery_worker-1

# Celery beat logs
docker logs dealflow-celery_beat-1

# FastAPI logs
docker logs dealflow-api-1
```

### Database Tracking

View sync history in `integration_syncs` table:

```sql
SELECT * FROM integration_syncs 
WHERE integration_type = 'google_ads'
ORDER BY created_at DESC;
```

### Activity Timeline

View lead creation events in `activity_timelines` table:

```sql
SELECT * FROM activity_timelines
WHERE event_type = 'lead_created'
  AND created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;
```

## Troubleshooting

### Task Failures

1. Check Celery logs:
   ```bash
   docker logs dealflow-celery_worker-1 | grep ERROR
   ```

2. Check task result:
   ```
   GET /api/integrations/google-ads/status/{task_id}
   ```

3. Check database for errors:
   ```sql
   SELECT * FROM integration_syncs
   WHERE status = 'failed'
   ORDER BY created_at DESC;
   ```

### Webhook Not Triggering

1. Verify webhook URL in Google Ads account:
   - Should be: `https://your-domain/api/integrations/google-ads/webhook`

2. Verify webhook secret matches:
   - Check `GOOGLE_ADS_WEBHOOK_SECRET` in `.env`
   - Matches secret in Google Ads configuration

3. Test webhook:
   ```
   POST /api/integrations/google-ads/test
   ```

### Duplicates Being Created

1. Check duplicate detection logic in `google_ads_service.check_duplicate()`

2. Verify campaign-to-division mapping is correct

3. Check if leads have different emails/phones

## Production Considerations

### 1. API Rate Limiting

Google Ads API has rate limits. Implement:
- Exponential backoff in Celery tasks ✓ (already configured)
- Batch processing for bulk imports
- Queue prioritization

### 2. Webhook Signature Validation

Always validate HMAC-SHA256 signature ✓ (implemented)

### 3. Error Handling & Retries

Tasks are configured with:
- Max retries: 3
- Soft time limit: 25 minutes
- Hard time limit: 30 minutes
- Automatic retry on failure ✓ (implemented)

### 4. Sensitive Data

- Never log API keys
- Use environment variables for credentials
- Consider encrypting webhook secrets

### 5. Monitoring & Alerts

Set up alerts for:
- Task failure rate
- Long task execution times
- Duplicate lead ratio

### 6. Campaign-to-Division Mapping

For production, load mapping from database:

```python
def map_campaign_to_division(campaign_id: str) -> Optional[UUID]:
    db = SessionLocal()
    mapping = db.query(CampaignDivisionMapping).filter_by(
        campaign_id=campaign_id
    ).first()
    return mapping.division_id if mapping else None
```

## Testing

### 1. Test Webhook with Mock Payload

```bash
curl -X POST http://localhost:8000/api/integrations/google-ads/test
```

Check logs and database for new test lead.

### 2. Test Manual Sync

```bash
curl -X POST http://localhost:8000/api/integrations/google-ads/sync
```

### 3. Monitor Task Status

```bash
# Check task status
curl http://localhost:8000/api/integrations/google-ads/status/{task_id}
```

### 4. Verify Duplicates Aren't Created

Create same lead twice, verify second is skipped:

```python
# First webhook
POST /api/integrations/google-ads/webhook
{
  "email": "john@example.com",
  "first_name": "John",
  ...
}

# Second webhook (same email)
POST /api/integrations/google-ads/webhook
{
  "email": "john@example.com",
  "first_name": "John",
  ...
}

# Result: Only 1 lead created, 1 skipped
```

## Next Steps

1. Set up Google Ads API credentials
2. Configure campaign-to-division mapping
3. Deploy and test webhook
4. Monitor sync tasks
5. Set up alerts for failures
