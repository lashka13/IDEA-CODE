from pydantic import BaseModel
from datetime import datetime


class CommunityCreate(BaseModel):
    name: str
    slug: str
    description: str
    cover_url: str = ""
    icon_emoji: str = "\U0001f4bb"
    color: str = "#61DAFB"
    tags: list[str] = []


class CommunityResponse(BaseModel):
    id: str
    name: str
    slug: str
    description: str
    cover_url: str
    icon_emoji: str
    member_count: int
    material_count: int
    activity_score: float
    color: str
    tags: list[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class CommunityDetailResponse(CommunityResponse):
    is_member: bool = False
