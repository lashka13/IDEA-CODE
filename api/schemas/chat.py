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


class ChatMessageCreate(BaseModel):
    text: str
    reply_to_id: str | None = None


class ChatMessageResponse(BaseModel):
    id: str
    channel_id: str
    author_id: str
    text: str
    reply_to_id: str | None = None
    reactions: list[dict] = []
    created_at: datetime

    model_config = {"from_attributes": True}


class MessageReactionCreate(BaseModel):
    emoji: str
