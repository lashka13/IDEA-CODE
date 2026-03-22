import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from src.db import get_db
from src.conf import get_settings
from src.users.models import User
from src.users.schemas import UserCreate, UserLogin, UserUpdate, UserResponse, Token, CoinsOperation
from src.utils import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter()
settings = get_settings()


def _user_response(user: User) -> UserResponse:
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
        achievement_ids=user.achievement_ids,
        joined_at=user.joined_at,
        uploads_count=user.uploads_count,
        purchases_count=user.purchases_count,
    )


# ── Auth ──────────────────────────────────────────────────
@router.post("/auth/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(data: UserCreate, request: Request, db: AsyncSession = Depends(get_db)):
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
        achievement_ids=["ach-1"],
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    # Produce Kafka event
    kafka_producer = request.app.state.kafka_producer
    if kafka_producer is not None:
        await kafka_producer.send_and_wait("user.registered", {
            "user_id": user_id,
            "name": user.name,
            "username": user.username,
            "bonus": settings.REGISTRATION_BONUS,
        })

    token = create_access_token(user.id)
    return Token(access_token=token, user=_user_response(user))


@router.post("/auth/login", response_model=Token)
async def login(data: UserLogin, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.username == data.username))
    user = result.scalar_one_or_none()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token(user.id)
    return Token(access_token=token, user=_user_response(user))


@router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return _user_response(current_user)


# ── Users ─────────────────────────────────────────────────
@router.get("/users/", response_model=list[UserResponse])
async def get_users(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).order_by(User.rating.desc()))
    return [_user_response(u) for u in result.scalars().all()]


@router.get("/users/top", response_model=list[UserResponse])
async def get_top_authors(limit: int = 5, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).order_by(User.rating.desc()).limit(limit))
    return [_user_response(u) for u in result.scalars().all()]


@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(user_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return _user_response(user)


@router.patch("/users/me", response_model=UserResponse)
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
    return _user_response(current_user)


# ── Upload ────────────────────────────────────────────────
@router.post("/upload/")
async def upload_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    if not file.content_type:
        raise HTTPException(status_code=400, detail="No content type")
    allowed_types = [
        "image/jpeg", "image/png", "image/gif", "image/webp",
        "application/pdf", "video/mp4", "video/webm",
    ]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail=f"File type {file.content_type} not allowed")
    content = await file.read()
    if len(content) > settings.MAX_UPLOAD_SIZE:
        raise HTTPException(status_code=400, detail="File too large (max 10MB)")
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    ext = os.path.splitext(file.filename or "file")[1]
    filename = f"{uuid.uuid4().hex}{ext}"
    filepath = os.path.join(settings.UPLOAD_DIR, filename)
    with open(filepath, "wb") as f:
        f.write(content)
    return {"url": f"/uploads/{filename}", "filename": filename}


# ── Internal API (for other services) ─────────────────────
def _verify_service_token(request: Request):
    """Verify service-to-service token from X-Service-Token header."""
    expected = settings.INTERNAL_SERVICE_TOKEN
    if expected:
        token = request.headers.get("X-Service-Token", "")
        if token != expected:
            raise HTTPException(status_code=403, detail="Invalid service token")


@router.get("/internal/users/{user_id}", response_model=UserResponse)
async def internal_get_user(user_id: str, request: Request, db: AsyncSession = Depends(get_db)):
    _verify_service_token(request)
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return _user_response(user)


@router.post("/internal/users/{user_id}/deduct-coins")
async def internal_deduct_coins(
    user_id: str, request: Request, data: CoinsOperation, db: AsyncSession = Depends(get_db),
):
    _verify_service_token(request)
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.code_coins < data.amount:
        raise HTTPException(status_code=400, detail="Insufficient CodeCoins")
    user.code_coins -= data.amount
    user.purchases_count += 1
    await db.commit()
    return {"code_coins": user.code_coins}


@router.post("/internal/users/{user_id}/add-coins")
async def internal_add_coins(
    user_id: str, request: Request, data: CoinsOperation, db: AsyncSession = Depends(get_db),
):
    _verify_service_token(request)
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.code_coins += data.amount
    await db.commit()
    return {"code_coins": user.code_coins}
