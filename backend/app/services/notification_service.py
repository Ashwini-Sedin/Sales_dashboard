import os
from typing import List, Optional, Dict, Any
from fastapi import BackgroundTasks
from jinja2 import Environment, FileSystemLoader, select_autoescape
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import settings
from app.models.user import User
from app.models.lead import Lead
from app.models.division import Division
from app.models.notification import Notification
from app.core.database import SessionLocal
from sqlalchemy.orm import Session
from datetime import datetime, timezone

TEMPLATES_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "..", "templates", "emails")
env = Environment(
    loader=FileSystemLoader(TEMPLATES_DIR),
    autoescape=select_autoescape(['html', 'xml'])
)

class NotificationService:
    def __init__(self):
        self.sendgrid_key = settings.SENDGRID_API_KEY
        self.from_email = os.getenv("DEALFLOW_FROM_EMAIL", "noreply@dealflow.com")

    def send_email(
        self,
        to_emails: List[str],
        subject: str,
        template_name: str,
        context: Dict[str, Any],
        plain_text: Optional[str] = None,
    ) -> None:
        template = env.get_template(template_name)
        html_content = template.render(**context)
        if not plain_text:
            plain_text = f"{subject}\n\nThis email requires an HTML-compatible client."
        if self.sendgrid_key:
            message = Mail(
                from_email=self.from_email,
                to_emails=to_emails,
                subject=subject,
                html_content=html_content,
                plain_text_content=plain_text,
            )
            try:
                sg = SendGridAPIClient(self.sendgrid_key)
                sg.send(message)
            except Exception as e:
                print(f"SendGrid error: {e}")
        else:
            # Fallback to SMTP
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = self.from_email
            msg["To"] = ", ".join(to_emails)
            part1 = MIMEText(plain_text, "plain")
            part2 = MIMEText(html_content, "html")
            msg.attach(part1)
            msg.attach(part2)
            try:
                with smtplib.SMTP("localhost") as server:
                    server.sendmail(self.from_email, to_emails, msg.as_string())
            except Exception as e:
                print(f"SMTP error: {e}")

    def notify_new_lead(self, db: Session, lead_id: Any) -> None:
        lead: Lead = db.query(Lead).filter(Lead.id == lead_id).first()
        if not lead:
            return
        division: Division = db.query(Division).filter(Division.id == lead.division_id).first()
        owner: Optional[User] = db.query(User).filter(User.id == lead.owner_id).first() if lead.owner_id else None
        division_head: Optional[User] = db.query(User).filter(User.id == division.head_user_id).first() if division and division.head_user_id else None
        to_emails = []
        if owner and owner.email:
            to_emails.append(owner.email)
        if division_head and division_head.email:
            to_emails.append(division_head.email)
        if not to_emails:
            return
        context = {
            "lead_name": f"{lead.first_name} {lead.last_name}",
            "company_name": lead.company_name or "",
            "lead_email": lead.email or "",
            "lead_phone": lead.phone or "",
            "division_name": division.name if division else "",
            "action_url": f"https://app.dealflow.com/leads/{lead.id}",
            "year": datetime.now(timezone.utc).year,
        }
        self.send_email(
            to_emails=to_emails,
            subject=f"New Lead Assigned: {lead.first_name} {lead.last_name}",
            template_name="new_lead.html",
            context=context,
        )

    def notify_stage_change(self, db: Session, lead_id: Any, old_stage: str, new_stage: str, actor_id: Any) -> None:
        lead: Lead = db.query(Lead).filter(Lead.id == lead_id).first()
        if not lead:
            return
        division: Division = db.query(Division).filter(Division.id == lead.division_id).first()
        owner: Optional[User] = db.query(User).filter(User.id == lead.owner_id).first() if lead.owner_id else None
        division_head: Optional[User] = db.query(User).filter(User.id == division.head_user_id).first() if division and division.head_user_id else None
        to_emails = []
        if owner and owner.email:
            to_emails.append(owner.email)
        if division_head and division_head.email:
            to_emails.append(division_head.email)
        if not to_emails:
            return
        context = {
            "lead_name": f"{lead.first_name} {lead.last_name}",
            "company_name": lead.company_name or "",
            "lead_email": lead.email or "",
            "lead_phone": lead.phone or "",
            "division_name": division.name if division else "",
            "old_stage": old_stage,
            "new_stage": new_stage,
            "action_url": f"https://app.dealflow.com/leads/{lead.id}",
            "year": datetime.now(timezone.utc).year,
        }
        self.send_email(
            to_emails=to_emails,
            subject=f"Lead Stage Changed: {lead.first_name} {lead.last_name} ({old_stage} → {new_stage})",
            template_name="stage_changed.html",
            context=context,
        )

    def create_in_app_notification(self, db: Session, user_id: Any, lead_id: Any, type_: str, message: str) -> Notification:
        notification = Notification(
            user_id=user_id,
            lead_id=lead_id,
            type=type_,
            message=message,
            is_read=False,
            created_at=datetime.now(timezone.utc),
        )
        db.add(notification)
        db.commit()
        db.refresh(notification)

        from app.core.socket_manager import socket_manager
        import asyncio
        
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                asyncio.create_task(socket_manager.emit_to_user_room(
                    user_id=str(user_id),
                    event="new_notification",
                    data={
                        "id": str(notification.id),
                        "type": notification.type,
                        "message": notification.message,
                        "lead_id": str(notification.lead_id) if notification.lead_id else None,
                        "created_at": notification.created_at.isoformat()
                    }
                ))
            else:
                loop.run_until_complete(socket_manager.emit_to_user_room(
                    user_id=str(user_id),
                    event="new_notification",
                    data={
                        "id": str(notification.id),
                        "type": notification.type,
                        "message": notification.message,
                        "lead_id": str(notification.lead_id) if notification.lead_id else None,
                        "created_at": notification.created_at.isoformat()
                    }
                ))
        except RuntimeError:
            asyncio.run(socket_manager.emit_to_user_room(
                user_id=str(user_id),
                event="new_notification",
                data={
                    "id": str(notification.id),
                    "type": notification.type,
                    "message": notification.message,
                    "lead_id": str(notification.lead_id) if notification.lead_id else None,
                    "created_at": notification.created_at.isoformat()
                }
            ))

        return notification

    def notify_welcome(self, db: Session, user_id: Any) -> None:
        user: User = db.query(User).filter(User.id == user_id).first()
        if not user or not user.email:
            return
        
        context = {
            "first_name": user.first_name or "New User",
            "email": user.email,
            "login_url": "https://app.dealflow.com/login",
            "year": datetime.now(timezone.utc).year,
        }
        self.send_email(
            to_emails=[user.email],
            subject="Welcome to DealFlow!",
            template_name="welcome.html",
            context=context,
        )

notification_service = NotificationService()


async def create_in_app_notification(
    db,
    user_id,
    lead_id,
    type: str,
    message: str,
) -> None:
    """
    Standalone async helper to create an in-app notification and emit a
    real-time socket event. Compatible with async SQLAlchemy sessions used
    throughout the routers and document services.
    """
    from app.models.notification import Notification
    from app.core.socket_manager import socket_manager

    notification = Notification(
        user_id=user_id,
        lead_id=lead_id,
        type=type,
        message=message,
        is_read=False,
        created_at=datetime.now(timezone.utc),
    )
    db.add(notification)
    await db.flush()          # persist without committing the outer transaction

    try:
        await socket_manager.emit_to_user_room(
            user_id=str(user_id),
            event="new_notification",
            data={
                "id": str(notification.id),
                "type": notification.type,
                "message": notification.message,
                "lead_id": str(notification.lead_id) if notification.lead_id else None,
                "created_at": notification.created_at.isoformat(),
            },
        )
    except Exception:
        pass  # never let a socket error break the main transaction
