import uuid
from sqlalchemy import String, Integer, Float, Boolean, JSON, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column
from src.db import Base
from datetime import datetime


class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    title: Mapped[str] = mapped_column(String(300))
    description: Mapped[str] = mapped_column(String(5000))
    difficulty: Mapped[str] = mapped_column(String(20))  # easy, medium, hard
    category: Mapped[str] = mapped_column(String(30))  # algorithms, math, theory, system-design
    topic: Mapped[str] = mapped_column(String(100), default="")
    is_theory: Mapped[bool] = mapped_column(Boolean, default=False)
    input_format: Mapped[str] = mapped_column(String(2000), default="")
    output_format: Mapped[str] = mapped_column(String(2000), default="")
    constraints: Mapped[list] = mapped_column(JSON, default=list)
    examples: Mapped[list] = mapped_column(JSON, default=list)
    hidden_tests: Mapped[list] = mapped_column(JSON, default=list)
    time_limit_ms: Mapped[int] = mapped_column(Integer, default=1000)
    memory_limit_mb: Mapped[int] = mapped_column(Integer, default=256)
    solved_count: Mapped[int] = mapped_column(Integer, default=0)
    acceptance_rate: Mapped[float] = mapped_column(Float, default=0.0)
    tags: Mapped[list] = mapped_column(JSON, default=list)
    hints: Mapped[list] = mapped_column(JSON, default=list)
    options: Mapped[list] = mapped_column(JSON, default=list)
    correct_option_id: Mapped[str] = mapped_column(String(50), default="")
    explanation: Mapped[str] = mapped_column(String(5000), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class ThinkingAnalysis(Base):
    __tablename__ = "thinking_analyses"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: f"ta-{uuid.uuid4().hex[:8]}")
    user_id: Mapped[str] = mapped_column(String, index=True)
    task_id: Mapped[str] = mapped_column(String, index=True)
    task_title: Mapped[str] = mapped_column(String(300), default="")
    task_difficulty: Mapped[str] = mapped_column(String(20), default="")
    language: Mapped[str] = mapped_column(String(20), default="python")
    time_spent_seconds: Mapped[int] = mapped_column(Integer, default=0)
    thinking_log: Mapped[str] = mapped_column(String(10000), default="")
    code: Mapped[str] = mapped_column(String(10000), default="")
    thinking_score: Mapped[int] = mapped_column(Integer, default=0)
    thinking_level: Mapped[str] = mapped_column(String(20), default="")
    summary: Mapped[str] = mapped_column(String(2000), default="")
    strengths: Mapped[list] = mapped_column(JSON, default=list)
    weaknesses: Mapped[list] = mapped_column(JSON, default=list)
    patterns: Mapped[list] = mapped_column(JSON, default=list)
    recommendations: Mapped[list] = mapped_column(JSON, default=list)
    cognitive_metrics: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
