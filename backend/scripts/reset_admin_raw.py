import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from app.core.database import SessionLocal
from app.core.security import get_password_hash
from sqlalchemy import text

db = SessionLocal()
try:
    admin_email = "ceo@dealflow.com"
    hashed_password = get_password_hash("admin123")
    
    db.execute(
        text("UPDATE users SET hashed_password = :hp WHERE email = :email"),
        {"hp": hashed_password, "email": admin_email}
    )
    db.commit()
    print(f"Password for {admin_email} has been reset to 'admin123'")
except Exception as e:
    print(f"Error resetting password: {e}")
finally:
    db.close()
