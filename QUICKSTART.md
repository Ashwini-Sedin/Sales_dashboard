# Quick Start: Email & Calls Features

## Getting Started

### Prerequisites
- Python 3.9+
- Node.js 16+
- PostgreSQL
- Redis
- AWS S3 bucket
- Microsoft Azure credentials (for Graph API)

### 1. Backend Setup

```bash
# Navigate to backend
cd backend

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration:
#   - DATABASE_URL
#   - REDIS_URL
#   - AWS credentials
#   - AZURE credentials
#   - SECRET_KEY

# Run migrations
alembic upgrade head

# Start Celery worker
celery -A app.tasks.celery_app worker --loglevel=info

# In another terminal, start Celery Beat
celery -A app.tasks.celery_app beat --loglevel=info

# Start FastAPI server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Frontend Setup

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

### 3. Docker Setup (Recommended)

```bash
# From project root
docker-compose up -d

# This starts:
# - PostgreSQL
# - Redis
# - Backend (FastAPI)
# - Celery worker
# - Celery Beat
```

---

## Usage Guide

### Sending an Email

1. **Open Lead Detail Page**
   - Click on a lead from the dashboard

2. **Email Panel**
   - Scroll to "Email Threads" section
   - Click "Compose" button

3. **Compose Email**
   - Fill in recipient email (defaults to lead's email)
   - Add CC recipients (optional)
   - Enter subject
   - Write message (supports HTML via TipTap editor)
   - Add attachments (up to 5 files, 10MB each)
   - Click "Send"

4. **Email Appears**
   - Email sent indicator appears
   - After ~30 seconds, sent email syncs and appears in thread
   - Check timeline for activity log

### Viewing Call Recordings

1. **Open Lead Detail Page**
   - Click on a lead from the dashboard

2. **Calls Panel**
   - Scroll to "Call Recordings" section
   - See list of recordings with:
     - Duration (e.g., "15:32")
     - Recording date and time
     - File size
     - Delete option

3. **Play Recording**
   - Click "View" button
   - Modal opens with:
     - HTML5 audio player
     - Download button
     - Recording metadata
     - Transcription (if available)
     - Participant list

4. **Download**
   - Click "Download" in modal
   - File downloads to your computer

---

## API Testing

### Test Email Sending

```bash
curl -X POST http://localhost:8000/api/leads/{lead_id}/emails/send \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "to_email": "recipient@example.com",
    "subject": "Test Email",
    "body_html": "<p>This is a test</p>",
    "cc": [],
    "attachments": []
  }'
```

### Test Email Retrieval

```bash
curl -X GET http://localhost:8000/api/leads/{lead_id}/emails \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test Call Recordings

```bash
# Get recordings for a lead
curl -X GET http://localhost:8000/api/leads/{lead_id}/calls \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get playback URL
curl -X GET http://localhost:8000/api/leads/{lead_id}/calls/{call_id}/playback-url \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Monitoring

### Check Celery Tasks

```bash
# See active tasks
celery -A app.tasks.celery_app inspect active

# See task stats
celery -A app.tasks.celery_app inspect stats

# Purge all tasks (use with caution)
celery -A app.tasks.celery_app purge
```

### View Celery Beat Schedule

```bash
# Show scheduled tasks
celery -A app.tasks.celery_app inspect scheduled
```

### Check Logs

```bash
# Backend logs
tail -f backend.log

# Celery worker logs
tail -f celery.log

# Celery beat logs
tail -f celery-beat.log
```

---

## Troubleshooting

### Emails Not Sending
1. Check that current user has email configured
2. Verify AZURE credentials are correct
3. Check Celery worker is running
4. View backend logs for errors

### Calls Not Appearing
1. Verify Celery Beat is running
2. Check that Teams calls exist
3. Verify participant emails match lead emails
4. Check S3 bucket is accessible
5. View Celery logs for errors

### Audio Won't Play
1. Check S3 bucket CORS settings
2. Verify presigned URL is valid
3. Check browser console for errors
4. Ensure file format is supported

---

## Configuration Files

### .env Template

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/salesdb

# Redis
REDIS_URL=redis://localhost:6379

# AWS
AWS_ACCESS_KEY_ID=your_key_id
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
AWS_BUCKET_NAME=your-bucket-name

# Azure / MSAL
AZURE_CLIENT_ID=your_client_id
AZURE_CLIENT_SECRET=your_client_secret
AZURE_TENANT_ID=your_tenant_id

# Security
SECRET_KEY=your_super_secret_key_here_minimum_32_chars

# Other
ENVIRONMENT=development
DEBUG=true
```

### docker-compose.yml

Services included:
- `db`: PostgreSQL database
- `redis`: Redis cache/broker
- `backend`: FastAPI server
- `celery`: Celery worker
- `celery-beat`: Celery Beat scheduler

---

## Key Features Summary

### ✉️ Email Management
- ✅ Sync emails from Outlook via Microsoft Graph
- ✅ Send emails with CC and attachments
- ✅ Real-time webhook notifications
- ✅ Automatic periodic sync every 30 minutes
- ✅ Email threading by subject
- ✅ HTML preview and full body display

### 📞 Call Recording Management
- ✅ Auto-capture Teams recordings
- ✅ Match calls to leads by participant emails
- ✅ Store recordings in S3
- ✅ Stream audio playback
- ✅ Display transcriptions (if available)
- ✅ Show participant information
- ✅ Download recordings
- ✅ Delete old recordings

### 🔄 Background Processing
- ✅ Celery task queue
- ✅ Scheduled periodic tasks
- ✅ Real-time webhook processing
- ✅ WebSocket notifications
- ✅ Activity timeline logging

---

## Performance Tips

1. **Email Sync**: Runs every 30 minutes for all active leads
   - Adjust interval in `email_tasks.py` if needed
   - More frequent = higher API usage
   - Less frequent = older email data

2. **Call Capture**: Runs every 10 minutes
   - Adjust interval in `celery_app.py`
   - Checks last 24 hours of calls
   - Efficient filtering by participant email

3. **Database Indexing**:
   - Emails indexed by lead_id and message_id
   - Recordings indexed by lead_id
   - Consider adding indexes on created_at for better performance

4. **S3 Optimization**:
   - Use S3 life cycle policies to archive old recordings
   - Consider S3 Intelligent-Tiering for cost optimization
   - Presigned URLs expire after 7 days

---

## Next Steps

1. **Test the Features**
   - Send a test email
   - Verify it appears in the thread
   - Record a test Teams call
   - Verify it appears in the calls list

2. **Configure Integrations**
   - Set up Microsoft Graph API webhook
   - Configure S3 bucket CORS
   - Test all API endpoints

3. **Monitor in Production**
   - Set up error tracking (Sentry)
   - Monitor Celery task queue
   - Watch S3 usage and costs

4. **Enhance Features** (See Roadmap in IMPLEMENTATION_GUIDE.md)
   - Add email templates
   - Implement call transcription
   - Add call analytics

---

**For detailed information, see [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md)**
