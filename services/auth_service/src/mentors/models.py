import uuid
from sqlalchemy import String, Integer, Float, Boolean, JSON, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column
from src.db import Base
from datetime import datetime


class MentorProfile(Base):
    __tablename__ = "mentor_profiles"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    user_id: Mapped[str] = mapped_column(String, unique=True, index=True)
    name: Mapped[str] = mapped_column(String(200))
    avatar_url: Mapped[str] = mapped_column(String(500), default="")
    title: Mapped[str] = mapped_column(String(200))
    company: Mapped[str] = mapped_column(String(200))
    experience: Mapped[str] = mapped_column(String(50))
    bio: Mapped[str] = mapped_column(String(1000), default="")
    tech_stack: Mapped[list] = mapped_column(JSON, default=list)
    rating: Mapped[float] = mapped_column(Float, default=5.0)
    review_count: Mapped[int] = mapped_column(Integer, default=0)
    sessions_completed: Mapped[int] = mapped_column(Integer, default=0)
    price_per_hour: Mapped[int] = mapped_column(Integer, default=50)
    available: Mapped[bool] = mapped_column(Boolean, default=True)
    specializations: Mapped[list] = mapped_column(JSON, default=list)
    languages: Mapped[list] = mapped_column(JSON, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class MentorBooking(Base):
    __tablename__ = "mentor_bookings"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: f"booking-{uuid.uuid4().hex[:8]}")
    user_id: Mapped[str] = mapped_column(String, index=True)
    mentor_id: Mapped[str] = mapped_column(String, index=True)
    mentor_name: Mapped[str] = mapped_column(String(200))
    topic: Mapped[str] = mapped_column(String(200))
    date: Mapped[str] = mapped_column(String(30))
    time: Mapped[str] = mapped_column(String(10))
    comment: Mapped[str] = mapped_column(String(1000), default="")
    price: Mapped[int] = mapped_column(Integer)
    status: Mapped[str] = mapped_column(String(20), default="pending")  # pending, confirmed, completed, cancelled
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
