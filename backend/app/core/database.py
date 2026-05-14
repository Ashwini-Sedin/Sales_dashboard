from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

# Sync Engine (for existing routers)
engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Async Engine (for new document/task routers)
ASYNC_DATABASE_URL = settings.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")
# Ensure sslmode is handled for asyncpg if present
if "sslmode=require" in ASYNC_DATABASE_URL and "ssl=" not in ASYNC_DATABASE_URL:
    ASYNC_DATABASE_URL = ASYNC_DATABASE_URL.replace("sslmode=require", "ssl=require")

import sqlalchemy.dialects.postgresql.asyncpg as dialect_asyncpg

# Monkey-patch SQLAlchemy's asyncpg dialect to avoid channel_binding error with asyncpg 0.31.0
original_connect = dialect_asyncpg.AsyncAdapt_asyncpg_dbapi.connect

def patched_connect(self, *arg, **kw):
    kw.pop("channel_binding", None)
    return original_connect(self, *arg, **kw)

dialect_asyncpg.AsyncAdapt_asyncpg_dbapi.connect = patched_connect

async_engine = create_async_engine(ASYNC_DATABASE_URL)
AsyncSessionLocal = async_sessionmaker(autocommit=False, autoflush=False, bind=async_engine, expire_on_commit=False)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

async def get_async_db():
    async with AsyncSessionLocal() as db:
        try:
            yield db
        finally:
            await db.close()
