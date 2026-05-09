import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text, BIGINT
from sqlalchemy.dialects.postgresql import UUID, JSONB

from app.core.database import Base

class CallRecording(Base):
    __tablename__ = "call_recordings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    lead_id = Column(UUID(as_uuid=True), ForeignKey("leads.id"))
    division_id = Column(UUID(as_uuid=True), ForeignKey("divisions.id"))
    teams_call_id = Column(String(500))
    s3_key = Column(String(1000))
    filename = Column(String(500))
    duration_seconds = Column(Integer)
    recorded_at = Column(DateTime(timezone=True))
    participants = Column(JSONB)
    transcription_text = Column(Text)
    file_size_bytes = Column(BIGINT)
