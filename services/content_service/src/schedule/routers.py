from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from src.db import get_db
from src.schedule.models import ScheduleEvent

router = APIRouter(prefix="/schedule", tags=["schedule"])


@router.get("/")
async def get_events(
    type: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    query = select(ScheduleEvent).order_by(ScheduleEvent.starts_at)
    if type:
        query = query.where(ScheduleEvent.type == type)
    result = await db.execute(query)
    return list(result.scalars().all())
