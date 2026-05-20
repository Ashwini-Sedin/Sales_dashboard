import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

os.environ["DATABASE_URL"] = "postgresql://neondb_owner:npg_L1xJ5IquYoSQ@ep-lively-dawn-aov7g6op-pooler.c-2.ap-southeast-1.aws.neon.tech/dealflow?sslmode=require&channel_binding=require"
os.environ["SECRET_KEY"] = "your-super-secret-key-please-change"
os.environ["REDIS_URL"] = "rediss://default:gQAAAAAAAc70AAIgcDJlNDk4NTZiM2VmZjg0MmUwOWExMGQwM2I0NDc0ZTI3NA@bursting-chimp-118516.upstash.io:6379"

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select
from app.models.lead import Lead
import pandas as pd

engine = create_engine(os.environ["DATABASE_URL"])
SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

try:
    query = db.query(Lead).filter(Lead.is_deleted == False)
    print("Testing db.bind...")
    try:
        df = pd.read_sql(query.statement, db.bind)
        print("db.bind works!", len(df))
    except Exception as e:
        print("db.bind failed:", e)

    print("\nTesting db.connection()...")
    try:
        df = pd.read_sql(query.statement, db.connection())
        print("db.connection() works!", len(df))
    except Exception as e:
        print("db.connection() failed:", e)

    print("\nTesting db.get_bind()...")
    try:
        df = pd.read_sql(query.statement, db.get_bind())
        print("db.get_bind() works!", len(df))
    except Exception as e:
        print("db.get_bind() failed:", e)

finally:
    db.close()
