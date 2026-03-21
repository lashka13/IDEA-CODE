from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from src.db import get_db
from src.challenges.models import Challenge

router = APIRouter(prefix="/challenges", tags=["challenges"])


@router.get("/")
async def get_challenges(
    status: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    query = select(Challenge).order_by(Challenge.created_at.desc())
    if status:
        query = query.where(Challenge.status == status)
    result = await db.execute(query)
    return list(result.scalars().all())


@router.get("/{challenge_id}")
async def get_challenge(challenge_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Challenge).where(Challenge.id == challenge_id))
    challenge = result.scalar_one_or_none()
    if not challenge:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Challenge not found")
    return challenge
