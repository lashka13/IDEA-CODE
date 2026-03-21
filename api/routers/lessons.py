import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from models.user import User
from models.material import Material
from models.lesson import Lesson
from models.purchase import Purchase
from schemas.lesson import LessonCreate, LessonResponse
from services.auth import get_current_user, get_optional_user

router = APIRouter(prefix="/materials/{material_id}/lessons", tags=["lessons"])


@router.get("/", response_model=list[LessonResponse])
async def get_lessons(
    material_id: str,
    current_user: User | None = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db),
):
    # Check material exists
    mat_result = await db.execute(select(Material).where(Material.id == material_id))
    material = mat_result.scalar_one_or_none()
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")

    result = await db.execute(
        select(Lesson)
        .where(Lesson.material_id == material_id)
        .order_by(Lesson.order)
    )
    lessons = result.scalars().all()

    # Check if user has access (author or purchased)
    has_access = False
    if current_user:
        if material.author_id == current_user.id:
            has_access = True
        else:
            purchase_result = await db.execute(
                select(Purchase).where(
                    Purchase.user_id == current_user.id,
                    Purchase.material_id == material_id,
                )
            )
            has_access = purchase_result.scalar_one_or_none() is not None

    # If no access, return only preview lessons with limited content
    if not has_access:
        preview_lessons = []
        for lesson in lessons:
            if lesson.is_preview:
                preview_lessons.append(LessonResponse.model_validate(lesson))
            else:
                preview_lessons.append(LessonResponse(
                    id=lesson.id,
                    material_id=lesson.material_id,
                    order=lesson.order,
                    title=lesson.title,
                    duration=lesson.duration,
                    contents=[],  # Hide content
                    is_preview=False,
                    created_at=lesson.created_at,
                ))
        return preview_lessons

    return [LessonResponse.model_validate(l) for l in lessons]


@router.post("/", response_model=LessonResponse, status_code=201)
async def create_lesson(
    material_id: str,
    data: LessonCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    mat_result = await db.execute(select(Material).where(Material.id == material_id))
    material = mat_result.scalar_one_or_none()
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")
    if material.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your material")

    lesson = Lesson(
        id=f"lesson-{uuid.uuid4().hex[:8]}",
        material_id=material_id,
        order=data.order,
        title=data.title,
        duration=data.duration,
        contents=data.contents,
        is_preview=data.is_preview,
    )
    db.add(lesson)
    await db.commit()
    await db.refresh(lesson)
    return LessonResponse.model_validate(lesson)
