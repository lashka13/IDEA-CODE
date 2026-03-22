from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from src.db import get_db
from src.mentors.models import MentorProfile, MentorBooking
from src.mentors.schemas import MentorResponse, BookMentorRequest, BookingResponse
from src.users.models import User
from src.utils import get_current_user

router = APIRouter(prefix="/mentors", tags=["mentors"])


@router.get("/", response_model=list[MentorResponse])
async def get_mentors(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(MentorProfile).order_by(MentorProfile.rating.desc()))
    return [MentorResponse.model_validate(m) for m in result.scalars().all()]


@router.get("/bookings/my", response_model=list[BookingResponse])
async def get_my_bookings(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(MentorBooking)
        .where(MentorBooking.user_id == current_user.id)
        .order_by(MentorBooking.created_at.desc())
    )
    return [BookingResponse.model_validate(b) for b in result.scalars().all()]


@router.post("/{mentor_id}/book", response_model=BookingResponse)
async def book_mentor(
    mentor_id: str,
    data: BookMentorRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Find mentor
    result = await db.execute(select(MentorProfile).where(MentorProfile.id == mentor_id))
    mentor = result.scalar_one_or_none()
    if not mentor:
        raise HTTPException(status_code=404, detail="Ментор не найден")
    if not mentor.available:
        raise HTTPException(status_code=400, detail="Ментор сейчас недоступен")

    # Check balance
    price = mentor.price_per_hour
    if current_user.code_coins < price:
        raise HTTPException(
            status_code=400,
            detail=f"Недостаточно CodeCoins. Нужно {price}, у вас {current_user.code_coins}",
        )

    # Deduct coins
    current_user.code_coins -= price
    mentor.sessions_completed += 1

    # Create booking
    booking = MentorBooking(
        user_id=current_user.id,
        mentor_id=mentor.id,
        mentor_name=mentor.name,
        topic=data.topic,
        date=data.date,
        time=data.time,
        comment=data.comment,
        price=price,
        status="pending",
    )
    db.add(booking)
    await db.commit()
    await db.refresh(booking)

    return BookingResponse.model_validate(booking)


@router.get("/{mentor_id}", response_model=MentorResponse)
async def get_mentor(mentor_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(MentorProfile).where(MentorProfile.id == mentor_id))
    mentor = result.scalar_one_or_none()
    if not mentor:
        raise HTTPException(status_code=404, detail="Mentor not found")
    return MentorResponse.model_validate(mentor)
