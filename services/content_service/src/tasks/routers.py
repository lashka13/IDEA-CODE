from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from src.db import get_db
from src.tasks.models import Task

router = APIRouter(prefix="/tasks", tags=["tasks"])


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
    return [t.__dict__ | {"_sa_instance_state": None} for t in result.scalars().all()
            if t.__dict__.pop("_sa_instance_state", None) or True]


@router.get("/{task_id}")
async def get_task(task_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Task).where(Task.id == task_id))
    task = result.scalar_one_or_none()
    if not task:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Task not found")
    return task
