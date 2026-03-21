from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from models.user import User
from schemas.user import UserResponse, UserUpdate
from services.auth import get_current_user

router = APIRouter(prefix="/users", tags=["users"])


def _user_to_response(user: User) -> UserResponse:
    achievement_ids = [ua.achievement_id for ua in user.achievements]
    return UserResponse(
        id=user.id,
        name=user.name,
        username=user.username,
        avatar_url=user.avatar_url,
        bio=user.bio,
        rating=user.rating,
        code_coins=user.code_coins,
        level=user.level,
        level_title=user.level_title,
        tech_stack=user.tech_stack,
        skills=user.skills,
        achievement_ids=achievement_ids,
        joined_at=user.joined_at,
        uploads_count=user.uploads_count,
        purchases_count=user.purchases_count,
    )


@router.get("/", response_model=list[UserResponse])
async def get_users(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).order_by(User.rating.desc()))
    users = result.scalars().all()
    return [_user_to_response(u) for u in users]


@router.get("/top", response_model=list[UserResponse])
async def get_top_authors(limit: int = 5, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).order_by(User.rating.desc()).limit(limit))
    users = result.scalars().all()
    return [_user_to_response(u) for u in users]


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(user_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return _user_to_response(user)


@router.patch("/me", response_model=UserResponse)
async def update_profile(
    data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(current_user, field, value)
    await db.commit()
    await db.refresh(current_user)
    return _user_to_response(current_user)
