from sqlalchemy import String, Integer, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.db import Base
from datetime import datetime


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    channel_id: Mapped[str] = mapped_column(String, ForeignKey("chat_channels.id"))
    author_id: Mapped[str] = mapped_column(String)
    text: Mapped[str] = mapped_column(String(5000))
    reply_to_id: Mapped[str | None] = mapped_column(String, ForeignKey("chat_messages.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    channel = relationship("ChatChannel", back_populates="messages")
    reactions = relationship("MessageReaction", back_populates="message", lazy="selectin")
    reply_to = relationship("ChatMessage", remote_side="ChatMessage.id", lazy="selectin")


class MessageReaction(Base):
    __tablename__ = "message_reactions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    message_id: Mapped[str] = mapped_column(String, ForeignKey("chat_messages.id"))
    user_id: Mapped[str] = mapped_column(String)
    emoji: Mapped[str] = mapped_column(String(10))
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    message = relationship("ChatMessage", back_populates="reactions")
