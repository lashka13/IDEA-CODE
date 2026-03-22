import uuid
from fastapi import APIRouter, Depends, HTTPException, Header, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from src.db import get_db
from src.utils import get_current_user_id, get_optional_user_id
from src.materials.models import Material
from src.lessons.models import Lesson
from src.lessons.schemas import LessonCreate, LessonResponse
from src.purchases.models import Purchase
from src.conf import get_settings

router = APIRouter(prefix="/materials/{material_id}/lessons", tags=["lessons"])
settings = get_settings()


@router.get("/", response_model=list[LessonResponse])
async def get_lessons(
    material_id: str,
    user_id: str | None = Depends(get_optional_user_id),
    db: AsyncSession = Depends(get_db),
    x_search_index: str | None = Header(None, alias="X-Search-Index"),
):
    mat_result = await db.execute(select(Material).where(Material.id == material_id))
    material = mat_result.scalar_one_or_none()
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")

    result = await db.execute(
        select(Lesson).where(Lesson.material_id == material_id).order_by(Lesson.order)
    )
    lessons = result.scalars().all()

    has_access = False
    if settings.SEARCH_INDEX_SECRET and x_search_index == settings.SEARCH_INDEX_SECRET:
        has_access = True
    elif user_id:
        if material.author_id == user_id:
            has_access = True
        else:
            purchase_result = await db.execute(
                select(Purchase).where(Purchase.user_id == user_id, Purchase.material_id == material_id)
            )
            has_access = purchase_result.scalar_one_or_none() is not None

    if not has_access:
        preview_lessons = []
        for lesson in lessons:
            if lesson.is_preview:
                preview_lessons.append(LessonResponse.model_validate(lesson))
            else:
                preview_lessons.append(LessonResponse(
                    id=lesson.id, material_id=lesson.material_id,
                    order=lesson.order, title=lesson.title, duration=lesson.duration,
                    contents=[], is_preview=False, created_at=lesson.created_at,
                ))
        return preview_lessons

    return [LessonResponse.model_validate(l) for l in lessons]


@router.post("/", response_model=LessonResponse, status_code=201)
async def create_lesson(
    material_id: str,
    data: LessonCreate,
    request: Request,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    mat_result = await db.execute(select(Material).where(Material.id == material_id))
    material = mat_result.scalar_one_or_none()
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")
    if material.author_id != user_id:
        raise HTTPException(status_code=403, detail="Not your material")

    lesson = Lesson(
        id=f"lesson-{uuid.uuid4().hex[:8]}", material_id=material_id,
        order=data.order, title=data.title, duration=data.duration,
        contents=data.contents, is_preview=data.is_preview,
    )
    db.add(lesson)
    await db.commit()
    await db.refresh(lesson)

    kafka_producer = request.app.state.kafka_producer
    if kafka_producer is not None:
        await kafka_producer.send_and_wait("material.updated", {"material_id": material_id})

    return LessonResponse.model_validate(lesson)
