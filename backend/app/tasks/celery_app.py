from celery import Celery
from celery.schedules import schedule, crontab
from app.core.config import settings

# Celery requires rediss:// URL to have the ssl_cert_reqs parameter set to CERT_REQUIRED, CERT_OPTIONAL, or CERT_NONE
redis_url = settings.REDIS_URL
if redis_url.startswith("rediss://") and "ssl_cert_reqs" not in redis_url:
    separator = "&" if "?" in redis_url else "?"
    redis_url = f"{redis_url}{separator}ssl_cert_reqs=CERT_NONE"

celery_app = Celery(
    "dealflow",
    broker=redis_url,
    backend=redis_url,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=30 * 60,  # 30 minutes hard limit
    task_soft_time_limit=25 * 60,  # 25 minutes soft limit
)

# Celery Beat Schedule for periodic tasks
celery_app.conf.beat_schedule = {
    "sync-google-ads-leads-every-15-minutes": {
        "task": "app.tasks.google_ads_tasks.sync_google_ads_leads",
        "schedule": schedule(run_every=settings.GOOGLE_ADS_SYNC_INTERVAL_MINUTES * 60),
        "options": {"queue": "default"},
    },
    "capture-teams-recordings": {
        "task": "app.tasks.teams_tasks.capture_teams_recordings",
        "schedule": crontab(minute="*/10"),
    },
}
