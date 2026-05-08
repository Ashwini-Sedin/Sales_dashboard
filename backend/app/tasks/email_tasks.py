import asyncio
from uuid import UUID
from app.tasks.celery_app import celery_app
from app.core.database import SessionLocal
from app.models.lead import Lead
from app.services.email_sync_service import sync_emails_for_lead

@celery_app.task(name="sync_lead_emails")
def sync_lead_emails(lead_id: str):
    """
    Celery task to sync emails for a specific lead.
    Calls the async sync_emails_for_lead function.
    """
    db = SessionLocal()
    try:
        # Run the async function in a synchronous context
        asyncio.run(sync_emails_for_lead(db, UUID(lead_id)))
    except Exception as e:
        print(f"Error syncing emails for lead {lead_id}: {e}")
        # Could implement retry logic here if necessary
    finally:
        db.close()

@celery_app.on_after_configure.connect
def setup_periodic_tasks(sender, **kwargs):
    # Calls sync_all_active_leads() every 30 minutes (1800 seconds)
    sender.add_periodic_task(1800.0, sync_all_active_leads.s(), name='sync_all_active_leads_every_30m')

@celery_app.task(name="sync_all_active_leads")
def sync_all_active_leads():
    """
    Periodic task to enqueue email sync for all active leads.
    """
    db = SessionLocal()
    try:
        # Filter for leads that are not won, lost, or deleted (active leads)
        from app.models.lead import LeadStatus
        active_leads = db.query(Lead).filter(
            Lead.is_deleted == False,
            Lead.status.notin_([LeadStatus.won, LeadStatus.lost])
        ).all()
        
        for lead in active_leads:
            sync_lead_emails.delay(str(lead.id))
            
    except Exception as e:
        print(f"Error in sync_all_active_leads: {e}")
    finally:
        db.close()
