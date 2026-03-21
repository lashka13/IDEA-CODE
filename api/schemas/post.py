from pydantic import BaseModel
from datetime import datetime


class PostCreate(BaseModel):
    title: str
    content: str


class PostResponse(BaseModel):
    id: str
    community_id: str
    author_id: str
    title: str
    content: str
    likes_count: int
    comments_count: int
    created_at: datetime

    model_config = {"from_attributes": True}
