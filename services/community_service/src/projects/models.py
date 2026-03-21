from sqlalchemy import String, Integer, JSON, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column
from src.db import Base
from datetime import datetime


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    title: Mapped[str] = mapped_column(String(300))
    cover_url: Mapped[str] = mapped_column(String(500), default="")
    description: Mapped[str] = mapped_column(String(2000))
    difficulty: Mapped[str] = mapped_column(String(20))  # beginner, intermediate, advanced
    status: Mapped[str] = mapped_column(String(20))  # recruiting, in-progress, review, completed
    tech_stack: Mapped[list] = mapped_column(JSON, default=list)
    mentor_id: Mapped[str] = mapped_column(String, default="")
    tasks_count: Mapped[int] = mapped_column(Integer, default=0)
    deadline: Mapped[str] = mapped_column(String(30), default="")
    reward_coins: Mapped[int] = mapped_column(Integer, default=0)
    team_slots: Mapped[list] = mapped_column(JSON, default=list)
    members: Mapped[list] = mapped_column(JSON, default=list)
    max_members: Mapped[int] = mapped_column(Integer, default=6)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
