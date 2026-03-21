from sqlalchemy import String, Boolean, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.db import Base
from datetime import datetime


class ChatChannel(Base):
    __tablename__ = "chat_channels"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    description: Mapped[str] = mapped_column(String(500), default="")
    icon: Mapped[str] = mapped_column(String(10), default="💬")
    community_id: Mapped[str | None] = mapped_column(String, nullable=True)
    is_general: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    messages = relationship("ChatMessage", back_populates="channel", lazy="selectin")
