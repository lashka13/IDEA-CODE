from sqlalchemy import String, Integer, Float, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base
from datetime import datetime


class Comment(Base):
    __tablename__ = "comments"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    material_id: Mapped[str] = mapped_column(String, ForeignKey("materials.id"))
    author_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"))
    text: Mapped[str] = mapped_column(String(2000))
    rating: Mapped[float] = mapped_column(Float, default=0.0)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    material = relationship("Material", back_populates="comments")
    author = relationship("User", back_populates="comments")
