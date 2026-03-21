from pydantic import BaseModel
from datetime import datetime


class LessonCreate(BaseModel):
    order: int
    title: str
    duration: str = ""
    contents: list[dict] = []
    is_preview: bool = False


class LessonResponse(BaseModel):
    id: str
    material_id: str
    order: int
    title: str
    duration: str
    contents: list[dict]
    is_preview: bool
    created_at: datetime

    model_config = {"from_attributes": True}
