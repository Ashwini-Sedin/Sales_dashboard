from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import get_db
import socketio
from app.core.socket_manager import sio

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

from app.routers import auth, dashboard, leads, notifications, users, divisions, audit_logs, emails, calls, documents, tasks, case_studies, templates, tech_library, nda_clauses
from app.routers.integrations import google_ads_router, graph, teams

# Include routers here
app.include_router(auth.router)
app.include_router(dashboard.router)
app.include_router(leads.router)
app.include_router(notifications.router)
app.include_router(users.router)
app.include_router(divisions.router)
app.include_router(google_ads_router)
app.include_router(graph.router)
app.include_router(audit_logs.router)
app.include_router(emails.router)
app.include_router(calls.router)
app.include_router(teams.router)
app.include_router(documents.router)
app.include_router(tasks.router, prefix="/api")
app.include_router(case_studies.router)
app.include_router(templates.router)
app.include_router(tech_library.router)
app.include_router(nda_clauses.router)

@sio.event
async def connect(sid, environ, auth):
    print(f"Socket client connected: {sid}")

@sio.event
async def disconnect(sid):
    print(f"Socket client disconnected: {sid}")

@sio.event
async def join_lead_room(sid, data):
    lead_id = data.get('lead_id')
    if lead_id:
        await sio.enter_room(sid, f"lead:{lead_id}")
        print(f"Client {sid} joined lead room: lead:{lead_id}")

@sio.event
async def leave_lead_room(sid, data):
    lead_id = data.get('lead_id')
    if lead_id:
        await sio.leave_room(sid, f"lead:{lead_id}")

@sio.event
async def join_user_room(sid, data):
    user_id = data.get('user_id')
    if user_id:
        await sio.enter_room(sid, f"user:{user_id}")
        print(f"Client {sid} joined user room: user:{user_id}")

@sio.event
async def leave_user_room(sid, data):
    user_id = data.get('user_id')
    if user_id:
        await sio.leave_room(sid, f"user:{user_id}")

socket_app = socketio.ASGIApp(sio, app)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:socket_app", host="0.0.0.0", port=8000, reload=True)

