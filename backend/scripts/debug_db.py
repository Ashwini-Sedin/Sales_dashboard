import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from app.core.database import SessionLocal
from sqlalchemy import text

db = SessionLocal()
try:
    result = db.execute(text("SELECT count(*) FROM users")).scalar()
    print(f"Total users in DB: {result}")
    
    # Check enum values
    result = db.execute(text("SELECT enum_range(NULL::user_role)")).scalar()
    print(f"Enum user_role values: {result}")
except Exception as e:
    print(f"Error: {e}")
finally:
    db.close()
