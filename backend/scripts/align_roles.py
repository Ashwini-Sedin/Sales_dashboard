import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from app.core.database import SessionLocal
from sqlalchemy import text

db = SessionLocal()
try:
    # 1. Update the database roles to match the code's expected strings
    # We'll use raw SQL to bypass all validation
    updates = [
        ("Chief Executive Officer", "super_admin"),
        ("Division Head", "division_head"),
        ("Sales Manager", "sales_manager"),
        ("Business Development Executive", "salesperson"),
        ("Presales Consultant", "presales_engineer"),
        ("Legal Counsel", "legal"),
        ("Operations Analyst", "viewer")
    ]
    
    for old, new in updates:
        db.execute(text("UPDATE users SET role = :new WHERE role = :old"), {"new": new, "old": old})
    
    db.commit()
    print("Database roles updated successfully to match code.")
    
except Exception as e:
    print(f"Error updating roles: {e}")
finally:
    db.close()
