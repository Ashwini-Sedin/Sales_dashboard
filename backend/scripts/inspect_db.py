import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from app.core.database import SessionLocal
from sqlalchemy import text

db = SessionLocal()
try:
    # Check column info
    result = db.execute(text("""
        SELECT column_name, data_type, udt_name 
        FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'role'
    """)).fetchone()
    print(f"Column 'role' info: {result}")
    
    # Check all custom types
    result = db.execute(text("""
        SELECT t.typname, array_agg(e.enumlabel)
        FROM pg_type t 
        JOIN pg_enum e ON t.oid = e.enumtypid  
        GROUP BY t.typname
    """)).fetchall()
    print("All Enums in DB:")
    for row in result:
        print(f"- {row[0]}: {row[1]}")
        
except Exception as e:
    print(f"Error: {e}")
finally:
    db.close()
