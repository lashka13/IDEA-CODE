from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from models.user import User
from models.achievement import Achievement, UserAchievement
from schemas.achievement import AchievementResponse
from services.auth import get_current_user

router = APIRouter(prefix="/achievements", tags=["achievements"])


@router.get("/", response_model=list[AchievementResponse])
async def get_all_achievements(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Achievement))
    return [AchievementResponse.model_validate(a) for a in result.scalars().all()]


@router.get("/my", response_model=list[AchievementResponse])
async def get_my_achievements(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Achievement)
        .join(UserAchievement)
        .where(UserAchievement.user_id == current_user.id)
    )
    achievements = result.scalars().all()
    # Get unlock dates
    ua_result = await db.execute(
        select(UserAchievement).where(UserAchievement.user_id == current_user.id)
    )
    ua_map = {ua.achievement_id: ua.unlocked_at for ua in ua_result.scalars().all()}

    return [
        AchievementResponse(
            id=a.id,
            name=a.name,
            description=a.description,
            icon=a.icon,
            rarity=a.rarity,
            unlocked_at=ua_map.get(a.id),
        )
        for a in achievements
    ]


@router.get("/user/{user_id}", response_model=list[AchievementResponse])
async def get_user_achievements(user_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Achievement)
        .join(UserAchievement)
        .where(UserAchievement.user_id == user_id)
    )
    achievements = result.scalars().all()
    ua_result = await db.execute(
        select(UserAchievement).where(UserAchievement.user_id == user_id)
    )
    ua_map = {ua.achievement_id: ua.unlocked_at for ua in ua_result.scalars().all()}

    return [
        AchievementResponse(
            id=a.id,
            name=a.name,
            description=a.description,
            icon=a.icon,
            rarity=a.rarity,
            unlocked_at=ua_map.get(a.id),
        )
        for a in achievements
    ]
