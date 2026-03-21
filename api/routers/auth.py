import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from models.user import User
from models.transaction import Transaction
from models.notification import Notification
from models.achievement import UserAchievement
from schemas.user import UserCreate, UserLogin, UserResponse, Token
from services.auth import hash_password, verify_password, create_access_token, get_current_user
from config import get_settings

router = APIRouter(prefix="/auth", tags=["auth"])
settings = get_settings()


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(data: UserCreate, db: AsyncSession = Depends(get_db)):
    # Check existing
    result = await db.execute(select(User).where((User.username == data.username) | (User.email == data.email)))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Username or email already exists")

    user_id = f"user-{uuid.uuid4().hex[:8]}"
    user = User(
        id=user_id,
        name=data.name,
        username=data.username,
        email=data.email,
        hashed_password=hash_password(data.password),
        bio=data.bio,
        tech_stack=data.tech_stack,
        code_coins=settings.REGISTRATION_BONUS,
        skills={"Frontend": 0, "Backend": 0, "DevOps": 0, "Data Science": 0, "Mobile": 0, "Security": 0},
    )
    db.add(user)

    # Registration bonus transaction
    tx = Transaction(
        id=f"tx-{uuid.uuid4().hex[:8]}",
        user_id=user_id,
        type="reward",
        amount=settings.REGISTRATION_BONUS,
        description="Бонус за регистрацию",
    )
    db.add(tx)

    # First achievement
    first_ach = UserAchievement(
        user_id=user_id,
        achievement_id="ach-1",
    )
    db.add(first_ach)

    # Welcome notification
    notif = Notification(
        id=f"notif-{uuid.uuid4().hex[:8]}",
        user_id=user_id,
        type="achievement",
        title="Добро пожаловать!",
        message=f"Вы получили {settings.REGISTRATION_BONUS} CodeCoins в подарок!",
        link="/wallet",
    )
    db.add(notif)

    await db.commit()
    await db.refresh(user)

    token = create_access_token(user.id)
    achievement_ids = [ua.achievement_id for ua in user.achievements]

    return Token(
        access_token=token,
        user=UserResponse(
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
        ),
    )


@router.post("/login", response_model=Token)
async def login(data: UserLogin, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.username == data.username))
    user = result.scalar_one_or_none()

    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token(user.id)
    achievement_ids = [ua.achievement_id for ua in user.achievements]

    return Token(
        access_token=token,
        user=UserResponse(
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
        ),
    )


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    achievement_ids = [ua.achievement_id for ua in current_user.achievements]
    return UserResponse(
        id=current_user.id,
        name=current_user.name,
        username=current_user.username,
        avatar_url=current_user.avatar_url,
        bio=current_user.bio,
        rating=current_user.rating,
        code_coins=current_user.code_coins,
        level=current_user.level,
        level_title=current_user.level_title,
        tech_stack=current_user.tech_stack,
        skills=current_user.skills,
        achievement_ids=achievement_ids,
        joined_at=current_user.joined_at,
        uploads_count=current_user.uploads_count,
        purchases_count=current_user.purchases_count,
    )
