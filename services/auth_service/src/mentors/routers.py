from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from src.db import get_db
from src.mentors.models import MentorProfile
from src.mentors.schemas import MentorResponse

router = APIRouter(prefix="/mentors", tags=["mentors"])


@router.get("/", response_model=list[MentorResponse])
async def get_mentors(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(MentorProfile).order_by(MentorProfile.rating.desc()))
    return [MentorResponse.model_validate(m) for m in result.scalars().all()]


@router.get("/{mentor_id}", response_model=MentorResponse)
async def get_mentor(mentor_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(MentorProfile).where(MentorProfile.id == mentor_id))
    mentor = result.scalar_one_or_none()
    if not mentor:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Mentor not found")
    return MentorResponse.model_validate(mentor)
