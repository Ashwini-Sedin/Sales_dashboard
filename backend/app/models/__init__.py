from .user import User, UserRole
from .division import Division
from .lead import Lead, LeadSource, LeadStatus
from .activity import ActivityTimeline, ActivityEventType
from .pipeline import LeadPipelineStage
from .notification import Notification
from .audit import AuditLog
from .integration_sync import IntegrationSync
from .notification_template import NotificationTemplate
from .email import EmailMessage, EmailAttachment

# For Alembic to discover all models
__all__ = [
    "User", "UserRole",
    "Division",
    "Lead", "LeadSource", "LeadStatus",
    "ActivityTimeline", "ActivityEventType",
    "LeadPipelineStage",
    "Notification",
    "AuditLog",
    "IntegrationSync",
    "NotificationTemplate",
    "EmailMessage",
    "EmailAttachment",
]
