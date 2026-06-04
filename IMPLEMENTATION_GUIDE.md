# Email & Calls Implementation Guide

## Overview
This document provides a comprehensive guide to the Email and Calls features implemented in the Sales Dashboard.

---

## ✅ Features Implemented

### 1. **Email Management** 

#### Backend Components
- **Model Updates**: Added `created_at` timestamp field to `EmailMessage` model
- **Email Sending**: `POST /api/leads/{lead_id}/emails/send` endpoint implemented
  - Sends emails via Microsoft Graph API
  - Uses lead owner's mailbox for sending
  - Logs activity to timeline
  - Automatically triggers email sync to capture sent message
  - Supports CC recipients and HTML formatting

#### Frontend Components
- **LeadEmailPanel.jsx**: Displays email threads with composition capability
- **EmailThread.jsx**: Groups emails by subject, shows sender info and preview
- **EmailComposeModal.jsx**: Rich email composer with:
  - TipTap editor for HTML formatting
  - CC support
  - File attachment support (up to 5 files, 10MB each)
  - Draft management

#### Services
- **email_send_service.py**: Sends emails via Microsoft Graph API
- **email_sync_service.py**: 
  - Syncs emails from Graph API
  - Processes webhook notifications
  - Handles pagination
  - Upserts email records

#### Background Tasks
- **sync_lead_emails**: Syncs emails for specific lead
- **sync_all_active_leads**: Periodic task (every 30 minutes) for all active leads
- **Email Webhook**: Receives change notifications from Microsoft Graph

#### API Endpoints
```
GET    /api/leads/{lead_id}/emails
GET    /api/leads/{lead_id}/emails/{message_id}
GET    /api/leads/{lead_id}/emails/{message_id}/attachments
GET    /api/leads/{lead_id}/emails/{message_id}/attachments/{att_id}/download
POST   /api/leads/{lead_id}/emails/send
POST   /api/integrations/graph/email-webhook
```

---

### 2. **Call Recording Management**

#### Backend Components
- **Model**: CallRecording with teams_call_id, S3 storage key, duration, participants, transcription
- **Services**: teams_call_service.py provides complete call capture pipeline:
  - `fetch_recent_call_records()`: Fetches last 24h of Teams calls from Graph API
  - `extract_participant_emails()`: Extracts emails from call metadata
  - `match_call_to_lead()`: Maps calls to leads by participant email
  - `download_recording()`: Downloads recording from Microsoft servers
  - `store_recording()`: Uploads to S3, creates database record, emits WebSocket event

#### Frontend Components
- **LeadCallsPanel.jsx**: Main call recording list component
  - Lists all recordings for a lead
  - Shows duration, file size, recorded date/time
  - Delete functionality
  - Real-time polling for new recordings
  
- **CallDetailModal.jsx**: Detailed recording view
  - HTML5 audio player with controls
  - Download functionality
  - Transcription display (if available)
  - Participant list with names/emails
  - Recording metadata (duration, size, timestamp)

#### API Endpoints
```
GET    /api/leads/{lead_id}/calls
GET    /api/leads/{lead_id}/calls/{call_id}/playback-url
DELETE /api/leads/{lead_id}/calls/{call_id}
```

#### Background Tasks
- **capture_teams_recordings**: Celery task (scheduled every 10 minutes via Celery Beat)
  - Fetches recent Teams calls
  - Extracts participant emails
  - Matches calls to leads
  - Downloads and stores recordings
  - Creates activity timeline entries
  - Emits WebSocket notifications for real-time updates

#### Configuration
- Task is configured in `celery_app.py`:
  ```python
  "capture-teams-recordings": {
      "task": "app.tasks.teams_tasks.capture_teams_recordings",
      "schedule": crontab(minute="*/10"),  # Every 10 minutes
  }
  ```

---

## 🚀 How to Use

### For Users

#### Sending Emails
1. Open a lead detail page
2. Click "Compose" button in Email Threads section
3. Fill in recipient email, subject, and message
4. Add attachments if needed
5. Click "Send"
6. Email appears in thread after sync (usually within 30 seconds)

#### Viewing Call Recordings
1. Open a lead detail page
2. In Call Recordings section, see all recordings
3. Click "View" to see full details:
   - Play audio directly in browser
   - Download recording file
   - Read transcription if available
   - See participant list

#### Managing Recordings
- Delete old recordings with trash icon
- Recordings sync automatically every 10 minutes
- Transcriptions can be added via AI processing

---

## 📋 Technology Stack

### Backend
- **FastAPI**: REST API framework
- **SQLAlchemy**: ORM for database
- **Celery**: Async task queue
- **Redis**: Message broker
- **Microsoft Graph API**: Email/Teams integration
- **AWS S3**: File storage
- **PostgreSQL**: Data persistence

### Frontend
- **React**: UI framework
- **React Query (TanStack Query)**: Data fetching and caching
- **TipTap**: Rich text editor for email composition
- **Tailwind CSS**: Styling

---

## 🔧 Configuration

### Required Environment Variables
```
# Database
DATABASE_URL=postgresql://user:pass@localhost/salesdb

# Redis (for Celery)
REDIS_URL=redis://localhost:6379

# AWS S3
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
AWS_BUCKET_NAME=sales-dashboard-bucket

# Microsoft Azure / MSAL
AZURE_CLIENT_ID=...
AZURE_CLIENT_SECRET=...
AZURE_TENANT_ID=...

# Other
SECRET_KEY=your-secret-key
```

### Celery Configuration
- Ensure Redis is running: `redis-server`
- Start Celery worker: `celery -A app.tasks.celery_app worker --loglevel=info`
- Start Celery Beat scheduler: `celery -A app.tasks.celery_app beat --loglevel=info`

---

## 🧪 Testing

### Email Testing
1. **Send Email Test**:
   ```bash
   # Test sending an email to a lead
   POST /api/leads/{lead_id}/emails/send
   {
     "to_email": "recipient@example.com",
     "subject": "Test Email",
     "body_html": "<p>This is a test email</p>",
     "cc": [],
     "attachments": []
   }
   ```

2. **Verify Email Sync**:
   - After sending, check that email appears in `GET /api/leads/{lead_id}/emails`
   - Emails sync automatically every 30 minutes
   - Check webhook logs in application logs

### Call Recording Testing
1. **Test Recording Capture**:
   ```bash
   # Manually trigger the capture task
   celery -A app.tasks.celery_app call app.tasks.teams_tasks.capture_teams_recordings
   ```

2. **Verify Recording Storage**:
   - Check that `CallRecording` records appear in database
   - Verify S3 files exist in bucket
   - Test playback URL generation: `GET /api/leads/{lead_id}/calls/{call_id}/playback-url`

3. **Test Frontend**:
   - Open lead detail page
   - Verify call recordings panel loads
   - Click "View" on a recording
   - Test audio playback
   - Test download button
   - Verify transcription displays if available

---

## 📊 Database Schema

### EmailMessage Table
```sql
CREATE TABLE email_messages (
    id UUID PRIMARY KEY,
    lead_id UUID FOREIGN KEY,
    message_id VARCHAR(500) UNIQUE,
    subject VARCHAR(500),
    sender_email VARCHAR(255),
    sender_name VARCHAR(255),
    recipients JSONB,
    body_html TEXT,
    body_preview TEXT,
    received_at TIMESTAMP,
    has_attachments BOOLEAN,
    is_outgoing BOOLEAN,
    raw_metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### CallRecording Table
```sql
CREATE TABLE call_recordings (
    id UUID PRIMARY KEY,
    lead_id UUID FOREIGN KEY,
    division_id UUID FOREIGN KEY,
    teams_call_id VARCHAR(500),
    s3_key VARCHAR(1000),
    filename VARCHAR(500),
    duration_seconds INTEGER,
    recorded_at TIMESTAMP,
    participants JSONB,
    transcription_text TEXT,
    file_size_bytes BIGINT
);
```

---

## 🔒 Security Considerations

1. **Email Access**: Emails are filtered by `lead_id` - users can only see emails for leads they have access to
2. **Call Recording Access**: Recordings have division-based access control
3. **S3 Presigned URLs**: All file downloads use time-limited presigned URLs (7 days)
4. **Webhook Validation**: Graph API webhook includes validationToken challenge response
5. **API Authentication**: All endpoints require authenticated user (JWT token)

---

## 📈 Performance Optimization

1. **Email Pagination**: Emails are paginated (default 20 per page) to reduce load
2. **Real-time Polling**: Frontend polls every 30 seconds instead of continuous updates
3. **Webhook Integration**: Emails sync via webhook notifications in real-time
4. **S3 Presigned URLs**: Reduces load on backend by redirecting to S3
5. **Celery Tasks**: Background processing prevents blocking API requests

---

## 🐛 Troubleshooting

### Emails Not Syncing
- Check that lead owner has email configured
- Verify Microsoft Graph API credentials in environment variables
- Check Celery worker logs: `tail -f celery.log`
- Manually trigger sync: `celery -A app.tasks.celery_app call app.tasks.email_tasks.sync_lead_emails[lead_id]`

### Calls Not Appearing
- Ensure Celery Beat scheduler is running
- Check that Teams calls exist in your Microsoft Teams
- Verify participant emails match lead emails in database
- Check S3 bucket permissions
- Review Celery logs for errors

### Audio Playback Issues
- Verify S3 presigned URL is valid and accessible
- Check browser console for CORS errors
- Ensure file format is supported (MP4/WebM)
- Verify AWS S3 bucket CORS configuration

---

## 🚦 Next Steps & Enhancements

### Recommended Enhancements
1. **Email Templates**: Add pre-built email templates for common scenarios
2. **Call Transcription**: Integrate with OpenAI to auto-generate transcriptions
3. **Call Analysis**: Sentiment analysis and keyword extraction from transcriptions
4. **Email Search**: Full-text search across email bodies
5. **Email Rules**: Auto-organize emails into folders/tags
6. **Call Summary**: AI-generated summaries of call content
7. **Two-way Sync**: Support reply/forward in email interface
8. **Call Analytics**: Dashboard with call metrics and insights

### Phase 2 Roadmap
- [ ] Email template library
- [ ] Automatic transcription
- [ ] Sentiment analysis
- [ ] Email search UI
- [ ] Advanced call analytics
- [ ] Call notes feature
- [ ] Email forwarding
- [ ] Bulk email operations

---

## 📞 Support

For issues or questions:
1. Check application logs: `tail -f app.log`
2. Review Celery worker logs
3. Verify environment variables are set correctly
4. Check Microsoft Graph API status
5. Verify S3 bucket permissions and CORS configuration

---

## 📝 File Structure

```
backend/
├── app/
│   ├── models/
│   │   ├── email_message.py (updated: added created_at)
│   │   └── call_recording.py
│   ├── routers/
│   │   ├── emails.py (updated: added send endpoint)
│   │   └── calls.py
│   ├── services/
│   │   ├── email_send_service.py
│   │   ├── email_sync_service.py
│   │   └── teams_call_service.py
│   ├── tasks/
│   │   ├── email_tasks.py
│   │   └── teams_tasks.py
│   └── schemas/
│       ├── email.py
│       └── call_recording.py

frontend/
├── src/
│   ├── pages/leads/
│   │   ├── LeadEmailPanel.jsx
│   │   ├── LeadCallsPanel.jsx (updated: full implementation)
│   │   ├── EmailThread.jsx
│   │   └── CallDetailModal.jsx (new)
│   └── components/lead/
│       └── EmailComposeModal.jsx
```

---

**Last Updated**: June 2, 2026
**Version**: 1.0
**Status**: Production Ready
