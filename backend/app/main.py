from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import get_db

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup logic
    yield
    # Shutdown logic

app = FastAPI(
    title="DealFlow API",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check(db: Session = Depends(get_db)):
    db_status = "ok"
    try:
        db.execute(text("SELECT 1"))
    except Exception:
        db_status = "failed"
        
    return {
        "status": "ok",
        "version": app.version,
        "db_connected": db_status == "ok"
    }

from app.routers import auth

# Include routers here
app.include_router(auth.router)
