from pydantic import BaseModel
from datetime import datetime


class AchievementResponse(BaseModel):
    id: str
    name: str
    description: str
    icon: str
    rarity: str
    unlocked_at: datetime | None = None

    model_config = {"from_attributes": True}


class UserAchievementResponse(BaseModel):
    achievement: AchievementResponse
    unlocked_at: datetime

    model_config = {"from_attributes": True}
