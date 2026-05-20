import os
import sys
from datetime import datetime, timedelta, timezone

# Add the parent directory to the path so we can import app modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal
from app.models.user import User
from app.models.notification import Notification

def seed():
    db = SessionLocal()
    try:
        users = db.query(User).all()
        if not users:
            print("No users found in database to seed notifications for.")
            return

        print(f"Found {len(users)} users. Seeding notifications...")
        
        now = datetime.now(timezone.utc)
        
        notifications_data = [
            {
                "type": "New lead",
                "message": "New lead: Ananya Das – BlueStar Tech\nGoogle Ads · Cloud Division · Score 28 · Owner auto-assigned: Sonal Kapoor",
                "delta": timedelta(hours=1),
                "is_read": False
            },
            {
                "type": "Document signed",
                "message": "Document signed: NDA – TechNova Pvt Ltd\nSigned PDF auto-saved to SharePoint · /DealFlow/Cloud/TechNova_PM/NDA/",
                "delta": timedelta(hours=3),
                "is_read": False
            },
            {
                "type": "Approval required",
                "message": "Approval required: SOW – Cloud Migration v1\nSuresh Rao submitted SOW for legal review. Please approve or reject with comments.",
                "delta": timedelta(hours=5),
                "is_read": False
            },
            {
                "type": "Call recorded",
                "message": "Call recorded: Quantex Corp – Sunita Joshi (42 min)\nStored in S3 · Participants: Nisha Reddy, Sunita Joshi · Linked to lead",
                "delta": timedelta(hours=7),
                "is_read": False
            },
            {
                "type": "Duplicate detected",
                "message": "Duplicate detected: Karan Patel – NexGen Systems\nEmail already exists (Lead DF-0041). Action required: Merge or create separately.",
                "delta": timedelta(hours=9),
                "is_read": False
            },
            {
                "type": "Stage changed",
                "message": "Stage changed: Ravi Shah → Negotiation\nChanged by Arjun Kumar. Previous: Proposal sent. Value updated ₹45L.",
                "delta": timedelta(days=1),
                "is_read": True
            }
        ]

        for user in users:
            # Delete existing notifications for a clean state
            db.query(Notification).filter(Notification.user_id == user.id).delete()
            
            for item in notifications_data:
                notif = Notification(
                    user_id=user.id,
                    type=item["type"],
                    message=item["message"],
                    is_read=item["is_read"],
                    created_at=now - item["delta"]
                )
                db.add(notif)
        
        db.commit()
        print("Notifications successfully seeded for all users!")
    except Exception as e:
        db.rollback()
        print(f"Error seeding notifications: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed()
