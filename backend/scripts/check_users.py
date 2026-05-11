import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from app.core.database import SessionLocal
from app.models.user import User

db = SessionLocal()
try:
    users = db.query(User).all()
    print(f"Found {len(users)} users:")
    for u in users:
        print(f"- {u.email} (ID: {u.id}, Role: {u.role})")
except Exception as e:
    print(f"Error: {e}")
finally:
    db.close()
