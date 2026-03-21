import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from models.user import User
from models.community import Community
from models.post import Post, PostLike
from schemas.post import PostCreate, PostResponse
from services.auth import get_current_user

router = APIRouter(prefix="/communities/{community_slug}/posts", tags=["posts"])


@router.get("/", response_model=list[PostResponse])
async def get_posts(community_slug: str, db: AsyncSession = Depends(get_db)):
    # Get community by slug
    comm_result = await db.execute(select(Community).where(Community.slug == community_slug))
    community = comm_result.scalar_one_or_none()
    if not community:
        raise HTTPException(status_code=404, detail="Community not found")

    result = await db.execute(
        select(Post)
        .where(Post.community_id == community.id)
        .order_by(Post.created_at.desc())
    )
    return [PostResponse.model_validate(p) for p in result.scalars().all()]


@router.post("/", response_model=PostResponse, status_code=201)
async def create_post(
    community_slug: str,
    data: PostCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    comm_result = await db.execute(select(Community).where(Community.slug == community_slug))
    community = comm_result.scalar_one_or_none()
    if not community:
        raise HTTPException(status_code=404, detail="Community not found")

    post = Post(
        id=f"post-{uuid.uuid4().hex[:8]}",
        community_id=community.id,
        author_id=current_user.id,
        title=data.title,
        content=data.content,
    )
    db.add(post)
    await db.commit()
    await db.refresh(post)
    return PostResponse.model_validate(post)


@router.post("/{post_id}/like")
async def toggle_like(
    community_slug: str,
    post_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Post).where(Post.id == post_id))
    post = result.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    like_result = await db.execute(
        select(PostLike).where(PostLike.post_id == post_id, PostLike.user_id == current_user.id)
    )
    existing = like_result.scalar_one_or_none()

    if existing:
        await db.delete(existing)
        post.likes_count = max(0, post.likes_count - 1)
        liked = False
    else:
        like = PostLike(post_id=post_id, user_id=current_user.id)
        db.add(like)
        post.likes_count += 1
        liked = True

    await db.commit()
    return {"liked": liked, "likes_count": post.likes_count}


@router.delete("/{post_id}", status_code=204)
async def delete_post(
    community_slug: str,
    post_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Post).where(Post.id == post_id))
    post = result.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    if post.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your post")
    await db.delete(post)
    await db.commit()
