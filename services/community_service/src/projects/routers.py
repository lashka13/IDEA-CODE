from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from src.db import get_db
from src.projects.models import Project

router = APIRouter(prefix="/projects", tags=["projects"])


@router.get("/")
async def get_projects(
    status: str | None = None,
    difficulty: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    query = select(Project).order_by(Project.created_at.desc())
    if status:
        query = query.where(Project.status == status)
    if difficulty:
        query = query.where(Project.difficulty == difficulty)
    result = await db.execute(query)
    return list(result.scalars().all())


@router.get("/{project_id}")
async def get_project(project_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Project not found")
    return project
