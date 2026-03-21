import uuid
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from src.db import get_db
from src.utils import get_current_user_id
from src.materials.models import Material
from src.comments.models import Comment
from src.comments.schemas import CommentCreate, CommentResponse

router = APIRouter(prefix="/materials/{material_id}/comments", tags=["comments"])


@router.get("/", response_model=list[CommentResponse])
async def get_comments(material_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Comment).where(Comment.material_id == material_id).order_by(Comment.created_at.desc())
    )
    return [CommentResponse.model_validate(c) for c in result.scalars().all()]


@router.post("/", response_model=CommentResponse, status_code=201)
async def create_comment(
    material_id: str, data: CommentCreate, request: Request,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    mat_result = await db.execute(select(Material).where(Material.id == material_id))
    material = mat_result.scalar_one_or_none()
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")

    comment = Comment(
        id=f"com-{uuid.uuid4().hex[:8]}", material_id=material_id,
        author_id=user_id, text=data.text, rating=data.rating,
    )
    db.add(comment)

    avg_result = await db.execute(
        select(func.avg(Comment.rating), func.count(Comment.id)).where(Comment.material_id == material_id)
    )
    row = avg_result.one()
    new_count = (row[1] or 0) + 1
    current_sum = (row[0] or 0) * (row[1] or 0) + data.rating
    material.rating = round(current_sum / new_count, 1)
    material.rating_count = new_count

    await db.commit()
    await db.refresh(comment)

    kafka_producer = request.app.state.kafka_producer
    await kafka_producer.send_and_wait("comment.created", {
        "comment_id": comment.id, "material_id": material_id,
        "author_id": user_id, "material_author_id": material.author_id,
        "material_title": material.title, "rating": data.rating,
    })

    return CommentResponse.model_validate(comment)


@router.delete("/{comment_id}", status_code=204)
async def delete_comment(
    material_id: str, comment_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Comment).where(Comment.id == comment_id, Comment.material_id == material_id)
    )
    comment = result.scalar_one_or_none()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    if comment.author_id != user_id:
        raise HTTPException(status_code=403, detail="Not your comment")
    await db.delete(comment)
    await db.commit()
