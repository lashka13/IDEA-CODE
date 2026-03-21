from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from src.db import get_db
from src.utils import get_current_user_id
from src.achievements.models import Achievement, UserAchievement
from src.achievements.schemas import AchievementResponse

router = APIRouter(prefix="/achievements", tags=["achievements"])


@router.get("/", response_model=list[AchievementResponse])
async def get_all_achievements(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Achievement))
    return [AchievementResponse.model_validate(a) for a in result.scalars().all()]


@router.get("/my", response_model=list[AchievementResponse])
async def get_my_achievements(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Achievement).join(UserAchievement).where(UserAchievement.user_id == user_id)
    )
    achievements = result.scalars().all()
    ua_result = await db.execute(
        select(UserAchievement).where(UserAchievement.user_id == user_id)
    )
    ua_map = {ua.achievement_id: ua.unlocked_at for ua in ua_result.scalars().all()}
    return [
        AchievementResponse(
            id=a.id, name=a.name, description=a.description,
            icon=a.icon, rarity=a.rarity, unlocked_at=ua_map.get(a.id),
        )
        for a in achievements
    ]


@router.get("/user/{user_id}", response_model=list[AchievementResponse])
async def get_user_achievements(user_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Achievement).join(UserAchievement).where(UserAchievement.user_id == user_id)
    )
    achievements = result.scalars().all()
    ua_result = await db.execute(
        select(UserAchievement).where(UserAchievement.user_id == user_id)
    )
    ua_map = {ua.achievement_id: ua.unlocked_at for ua in ua_result.scalars().all()}
    return [
        AchievementResponse(
            id=a.id, name=a.name, description=a.description,
            icon=a.icon, rarity=a.rarity, unlocked_at=ua_map.get(a.id),
        )
        for a in achievements
    ]
