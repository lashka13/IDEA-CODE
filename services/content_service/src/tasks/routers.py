from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from src.db import get_db
from src.tasks.models import Task

router = APIRouter(prefix="/tasks", tags=["tasks"])


def _task_to_dict(task: Task) -> dict:
    """Convert task to dict, hiding correct_option_id from client."""
    d = {c.name: getattr(task, c.name) for c in task.__table__.columns}
    d.pop("correct_option_id", None)
    return d


@router.get("/")
async def get_tasks(
    difficulty: str | None = None,
    category: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    query = select(Task).order_by(Task.created_at.desc())
    if difficulty:
        query = query.where(Task.difficulty == difficulty)
    if category:
        query = query.where(Task.category == category)
    result = await db.execute(query)
    return [_task_to_dict(t) for t in result.scalars().all()]


@router.get("/{task_id}")
async def get_task(task_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Task).where(Task.id == task_id))
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return _task_to_dict(task)


class CheckAnswerRequest(BaseModel):
    answer_id: str


@router.post("/{task_id}/check")
async def check_answer(
    task_id: str,
    body: CheckAnswerRequest,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Task).where(Task.id == task_id))
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    if not task.is_theory:
        raise HTTPException(status_code=400, detail="Not a theory task")

    correct = body.answer_id == task.correct_option_id
    return {
        "correct": correct,
        "correct_option_id": task.correct_option_id,
        "explanation": task.explanation or "",
    }
