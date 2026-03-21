from sqlalchemy import String, Integer, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.db import Base
from datetime import datetime


class Achievement(Base):
    __tablename__ = "achievements"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    description: Mapped[str] = mapped_column(String(300))
    icon: Mapped[str] = mapped_column(String(10))
    rarity: Mapped[str] = mapped_column(String(20))  # common, rare, epic, legendary

    users = relationship("UserAchievement", back_populates="achievement", lazy="selectin")


class UserAchievement(Base):
    __tablename__ = "user_achievements"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(String, index=True)
    achievement_id: Mapped[str] = mapped_column(String, ForeignKey("achievements.id"))
    unlocked_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    achievement = relationship("Achievement", back_populates="users")
