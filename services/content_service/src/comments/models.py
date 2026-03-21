from sqlalchemy import String, Float, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.db import Base
from datetime import datetime


class Comment(Base):
    __tablename__ = "comments"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    material_id: Mapped[str] = mapped_column(String, ForeignKey("materials.id"))
    author_id: Mapped[str] = mapped_column(String)
    text: Mapped[str] = mapped_column(String(2000))
    rating: Mapped[float] = mapped_column(Float, default=0.0)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    material = relationship("Material", back_populates="comments")
