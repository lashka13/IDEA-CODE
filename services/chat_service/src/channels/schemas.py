from pydantic import BaseModel
from datetime import datetime


class ChatChannelResponse(BaseModel):
    id: str
    name: str
    description: str
    icon: str
    community_id: str | None = None
    is_general: bool
    created_at: datetime

    model_config = {"from_attributes": True}
