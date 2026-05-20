import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

os.environ["DATABASE_URL"] = "postgresql://neondb_owner:npg_L1xJ5IquYoSQ@ep-lively-dawn-aov7g6op-pooler.c-2.ap-southeast-1.aws.neon.tech/dealflow?sslmode=require&channel_binding=require"
os.environ["SECRET_KEY"] = "your-super-secret-key-please-change"
os.environ["REDIS_URL"] = "rediss://default:gQAAAAAAAc70AAIgcDJlNDk4NTZiM2VmZjg0MmUwOWExMGQwM2I0NDc0ZTI3NA@bursting-chimp-118516.upstash.io:6379"

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.lead import Lead
import pandas as pd

engine = create_engine(os.environ["DATABASE_URL"])
SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

try:
    print("Testing manual fetch...")
    query = db.query(Lead).filter(Lead.is_deleted == False)
    
    # Execute query
    result = db.execute(query.statement)
    columns = result.keys()
    
    # Fetch rows (convert to dict or tuple)
    rows = result.fetchall()
    
    df = pd.DataFrame(rows, columns=columns)
    print("Success! Row count:", len(df))
    print("Columns:", list(df.columns))
    print("First row:\n", df.iloc[0].to_dict() if not df.empty else "Empty")
finally:
    db.close()
