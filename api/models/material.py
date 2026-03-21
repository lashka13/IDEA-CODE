from sqlalchemy import String, Integer, Float, JSON, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base
from datetime import datetime


class Material(Base):
    __tablename__ = "materials"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    title: Mapped[str] = mapped_column(String(300))
    description: Mapped[str] = mapped_column(String(2000))
    author_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"))
    cover_url: Mapped[str] = mapped_column(String(500), default="")
    price: Mapped[int] = mapped_column(Integer, default=0)
    rating: Mapped[float] = mapped_column(Float, default=0.0)
    rating_count: Mapped[int] = mapped_column(Integer, default=0)
    purchase_count: Mapped[int] = mapped_column(Integer, default=0)
    language: Mapped[str] = mapped_column(String(20))  # python, javascript, etc.
    technology: Mapped[list] = mapped_column(JSON, default=list)
    difficulty: Mapped[str] = mapped_column(String(20))  # junior, middle, senior
    format: Mapped[str] = mapped_column(String(20))  # code, article, video, presentation
    task_type: Mapped[str] = mapped_column(String(30))  # lab, coursework, pet-project, etc.
    tags: Mapped[list] = mapped_column(JSON, default=list)
    table_of_contents: Mapped[list] = mapped_column(JSON, default=list)
    community_id: Mapped[str | None] = mapped_column(String, ForeignKey("communities.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    # Relationships
    author = relationship("User", back_populates="materials")
    community = relationship("Community", back_populates="materials")
    comments = relationship("Comment", back_populates="material", lazy="selectin")
    lessons = relationship("Lesson", back_populates="material", lazy="selectin", order_by="Lesson.order")
    purchases = relationship("Purchase", back_populates="material", lazy="selectin")
