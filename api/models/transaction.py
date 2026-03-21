from sqlalchemy import String, Integer, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base
from datetime import datetime


class Transaction(Base):
    __tablename__ = "transactions"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id"))
    type: Mapped[str] = mapped_column(String(20))  # purchase, sale, royalty, reward, challenge-prize
    amount: Mapped[int] = mapped_column(Integer)
    description: Mapped[str] = mapped_column(String(500))
    material_id: Mapped[str | None] = mapped_column(String, ForeignKey("materials.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    user = relationship("User", back_populates="transactions")
