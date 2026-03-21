from sqlalchemy import String, Integer, Float, JSON, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base
from datetime import datetime


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    username: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255))
    avatar_url: Mapped[str] = mapped_column(String(500), default="")
    bio: Mapped[str] = mapped_column(String(500), default="")
    rating: Mapped[float] = mapped_column(Float, default=0.0)
    code_coins: Mapped[int] = mapped_column(Integer, default=50)
    level: Mapped[int] = mapped_column(Integer, default=1)
    level_title: Mapped[str] = mapped_column(String(50), default="Новичок")
    tech_stack: Mapped[list] = mapped_column(JSON, default=list)
    skills: Mapped[dict] = mapped_column(JSON, default=dict)
    uploads_count: Mapped[int] = mapped_column(Integer, default=0)
    purchases_count: Mapped[int] = mapped_column(Integer, default=0)
    joined_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    # Relationships
    materials = relationship("Material", back_populates="author", lazy="selectin")
    transactions = relationship("Transaction", back_populates="user", lazy="selectin")
    comments = relationship("Comment", back_populates="author", lazy="selectin")
    posts = relationship("Post", back_populates="author", lazy="selectin")
    purchases = relationship("Purchase", back_populates="user", lazy="selectin")
    achievements = relationship("UserAchievement", back_populates="user", lazy="selectin")
    community_memberships = relationship("CommunityMember", back_populates="user", lazy="selectin")
    notifications = relationship("Notification", back_populates="user", lazy="selectin")
