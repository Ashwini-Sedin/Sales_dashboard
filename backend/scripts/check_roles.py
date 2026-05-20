import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from app.core.database import SessionLocal
from sqlalchemy import text

db = SessionLocal()
try:
    result = db.execute(text("SELECT email, role FROM users LIMIT 10")).fetchall()
    for row in result:
        print(f"User: {row[0]}, Role: {row[1]}")
except Exception as e:
    print(f"Error: {e}")
finally:
    db.close()
