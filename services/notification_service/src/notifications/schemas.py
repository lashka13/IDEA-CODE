from pydantic import BaseModel
from datetime import datetime


class NotificationResponse(BaseModel):
    id: str
    user_id: str
    type: str
    title: str
    message: str
    is_read: bool
    link: str
    created_at: datetime

    model_config = {"from_attributes": True}
