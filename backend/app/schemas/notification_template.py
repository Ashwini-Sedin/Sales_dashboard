from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class NotificationTemplateBase(BaseModel):
    name: str
    subject: str
    body_html: str

class NotificationTemplateUpdate(BaseModel):
    subject: str
    body_html: str

class NotificationTemplate(NotificationTemplateBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
