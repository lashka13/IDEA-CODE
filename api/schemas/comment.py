from pydantic import BaseModel
from datetime import datetime


class CommentCreate(BaseModel):
    text: str
    rating: float


class CommentResponse(BaseModel):
    id: str
    material_id: str
    author_id: str
    text: str
    rating: float
    created_at: datetime

    model_config = {"from_attributes": True}
