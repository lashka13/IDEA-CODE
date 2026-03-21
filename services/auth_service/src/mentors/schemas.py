from pydantic import BaseModel
from datetime import datetime


class MentorResponse(BaseModel):
    id: str
    user_id: str
    name: str
    avatar_url: str
    title: str
    company: str
    experience: str
    bio: str
    tech_stack: list[str]
    rating: float
    review_count: int
    sessions_completed: int
    price_per_hour: int
    available: bool
    specializations: list[str]
    languages: list[str]
    created_at: datetime

    model_config = {"from_attributes": True}
