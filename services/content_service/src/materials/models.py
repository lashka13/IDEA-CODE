from sqlalchemy import String, Integer, Float, JSON, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.db import Base
from datetime import datetime


class Material(Base):
    __tablename__ = "materials"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    title: Mapped[str] = mapped_column(String(300))
    description: Mapped[str] = mapped_column(String(2000))
    author_id: Mapped[str] = mapped_column(String)
    cover_url: Mapped[str] = mapped_column(String(500), default="")
    # Relative URL e.g. /uploads/xxx.pdf (auth_service); used by search_service for RAG.
    pdf_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    price: Mapped[int] = mapped_column(Integer, default=0)
    rating: Mapped[float] = mapped_column(Float, default=0.0)
    rating_count: Mapped[int] = mapped_column(Integer, default=0)
    purchase_count: Mapped[int] = mapped_column(Integer, default=0)
    language: Mapped[str] = mapped_column(String(20))
    technology: Mapped[list] = mapped_column(JSON, default=list)
    difficulty: Mapped[str] = mapped_column(String(20))
    format: Mapped[str] = mapped_column(String(20))
    task_type: Mapped[str] = mapped_column(String(30))
    tags: Mapped[list] = mapped_column(JSON, default=list)
    table_of_contents: Mapped[list] = mapped_column(JSON, default=list)
    community_id: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    comments = relationship("Comment", back_populates="material", lazy="selectin")
    lessons = relationship("Lesson", back_populates="material", lazy="selectin", order_by="Lesson.order")
    purchases = relationship("Purchase", back_populates="material", lazy="selectin")
