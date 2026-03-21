from sqlalchemy import String, Integer, JSON, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.db import Base
from datetime import datetime


class RoadmapTrack(Base):
    __tablename__ = "roadmap_tracks"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    title: Mapped[str] = mapped_column(String(200))
    description: Mapped[str] = mapped_column(String(1000), default="")
    emoji: Mapped[str] = mapped_column(String(10), default="📚")
    color: Mapped[str] = mapped_column(String(20), default="#39FF14")
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    nodes = relationship("RoadmapNode", back_populates="track", lazy="selectin", order_by="RoadmapNode.order")


class RoadmapNode(Base):
    __tablename__ = "roadmap_nodes"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    track_id: Mapped[str] = mapped_column(String, ForeignKey("roadmap_tracks.id"))
    title: Mapped[str] = mapped_column(String(200))
    description: Mapped[str] = mapped_column(String(1000), default="")
    category: Mapped[str] = mapped_column(String(50), default="")
    difficulty: Mapped[str] = mapped_column(String(20), default="beginner")
    skills: Mapped[list] = mapped_column(JSON, default=list)
    material_ids: Mapped[list] = mapped_column(JSON, default=list)
    dependencies: Mapped[list] = mapped_column(JSON, default=list)
    estimated_hours: Mapped[int] = mapped_column(Integer, default=10)
    status: Mapped[str] = mapped_column(String(20), default="locked")  # completed, in-progress, available, locked
    progress: Mapped[int] = mapped_column(Integer, default=0)
    order: Mapped[int] = mapped_column(Integer, default=0)

    track = relationship("RoadmapTrack", back_populates="nodes")
