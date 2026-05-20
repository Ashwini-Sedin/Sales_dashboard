from typing import Optional
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from typing import Any

class CallRecordingResponse(BaseModel):
    id: UUID
    lead_id: UUID
    division_id: UUID
    teams_call_id: Optional[str] = None
    filename: str
    duration_seconds: int
    recorded_at: datetime
    participants: Optional[Any] = None
    transcription_text: Optional[str] = None
    file_size_bytes: int

    model_config = ConfigDict(from_attributes=True)

class PlaybackUrlResponse(BaseModel):
    playback_url: str
    expires_in: int
