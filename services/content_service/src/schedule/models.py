from sqlalchemy import String, Integer, Boolean, JSON, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column
from src.db import Base
from datetime import datetime


class ScheduleEvent(Base):
    __tablename__ = "schedule_events"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    title: Mapped[str] = mapped_column(String(300))
    description: Mapped[str] = mapped_column(String(2000), default="")
    type: Mapped[str] = mapped_column(String(20))  # stream, webinar, workshop, q-and-a
    host_name: Mapped[str] = mapped_column(String(200))
    host_avatar_url: Mapped[str] = mapped_column(String(500), default="")
    cover_url: Mapped[str] = mapped_column(String(500), default="")
    starts_at: Mapped[str] = mapped_column(String(30))
    duration_minutes: Mapped[int] = mapped_column(Integer, default=60)
    is_live: Mapped[bool] = mapped_column(Boolean, default=False)
    participants_count: Mapped[int] = mapped_column(Integer, default=0)
    max_participants: Mapped[int] = mapped_column(Integer, default=0)
    recording_available: Mapped[bool] = mapped_column(Boolean, default=False)
    tags: Mapped[list] = mapped_column(JSON, default=list)
    material_id: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
