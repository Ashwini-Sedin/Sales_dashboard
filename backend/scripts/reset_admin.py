import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from app.core.database import SessionLocal
from app.models.user import User
from app.core.security import get_password_hash

db = SessionLocal()
try:
    admin_email = "ceo@dealflow.com"
    user = db.query(User).filter(User.email == admin_email).first()
    
    if user:
        user.hashed_password = get_password_hash("admin123")
        db.commit()
        print(f"Password for {admin_email} has been reset to 'admin123'")
    else:
        # Create it if it doesn't exist
        from app.models.user import UserRole
        user = User(
            email=admin_email,
            hashed_password=get_password_hash("admin123"),
            first_name="Super",
            last_name="Admin",
            role=UserRole.super_admin,
            is_active=True
        )
        db.add(user)
        db.commit()
        print(f"Created new super-admin account: {admin_email} / admin123")
except Exception as e:
    print(f"Error resetting password: {e}")
finally:
    db.close()
