from sqlalchemy import String, Integer, Float, JSON, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.db import Base
from datetime import datetime


class Community(Base):
    __tablename__ = "communities"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    slug: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    description: Mapped[str] = mapped_column(String(1000))
    cover_url: Mapped[str] = mapped_column(String(500), default="")
    icon_emoji: Mapped[str] = mapped_column(String(10), default="\U0001f4bb")
    member_count: Mapped[int] = mapped_column(Integer, default=0)
    material_count: Mapped[int] = mapped_column(Integer, default=0)
    activity_score: Mapped[float] = mapped_column(Float, default=0.0)
    color: Mapped[str] = mapped_column(String(20), default="#61DAFB")
    tags: Mapped[list] = mapped_column(JSON, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    members = relationship("CommunityMember", back_populates="community", lazy="selectin")


class CommunityMember(Base):
    __tablename__ = "community_members"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    community_id: Mapped[str] = mapped_column(String, ForeignKey("communities.id"))
    user_id: Mapped[str] = mapped_column(String)
    role: Mapped[str] = mapped_column(String(20), default="member")
    joined_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    community = relationship("Community", back_populates="members")
