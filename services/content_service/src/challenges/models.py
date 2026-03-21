from sqlalchemy import String, Integer, JSON, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column
from src.db import Base
from datetime import datetime


class Challenge(Base):
    __tablename__ = "challenges"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    title: Mapped[str] = mapped_column(String(300))
    description: Mapped[str] = mapped_column(String(2000))
    type: Mapped[str] = mapped_column(String(20))  # weekly, daily, special
    difficulty: Mapped[str] = mapped_column(String(20))  # junior, middle, senior
    category: Mapped[str] = mapped_column(String(50), default="")
    prize_pool: Mapped[int] = mapped_column(Integer, default=0)
    participants_count: Mapped[int] = mapped_column(Integer, default=0)
    max_participants: Mapped[int] = mapped_column(Integer, default=0)
    starts_at: Mapped[str] = mapped_column(String(30))
    ends_at: Mapped[str] = mapped_column(String(30))
    status: Mapped[str] = mapped_column(String(20))  # upcoming, active, ended
    task_ids: Mapped[list] = mapped_column(JSON, default=list)
    top_participants: Mapped[list] = mapped_column(JSON, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
