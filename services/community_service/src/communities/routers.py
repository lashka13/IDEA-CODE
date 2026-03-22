import uuid
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from src.db import get_db
from src.utils import get_current_user_id, get_optional_user_id
from src.communities.models import Community, CommunityMember
from src.communities.schemas import CommunityCreate, CommunityResponse, CommunityDetailResponse

router = APIRouter(prefix="/communities", tags=["communities"])


@router.get("/", response_model=list[CommunityResponse])
async def get_communities(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Community).order_by(Community.activity_score.desc()))
    return [CommunityResponse.model_validate(c) for c in result.scalars().all()]


@router.get("/{slug}", response_model=CommunityDetailResponse)
async def get_community(
    slug: str,
    user_id: str | None = Depends(get_optional_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Community).where(Community.slug == slug))
    community = result.scalar_one_or_none()
    if not community:
        raise HTTPException(status_code=404, detail="Community not found")

    is_member = False
    if user_id:
        member_result = await db.execute(
            select(CommunityMember).where(
                CommunityMember.community_id == community.id,
                CommunityMember.user_id == user_id,
            )
        )
        is_member = member_result.scalar_one_or_none() is not None

    resp = CommunityDetailResponse.model_validate(community)
    resp.is_member = is_member
    return resp


@router.post("/", response_model=CommunityResponse, status_code=201)
async def create_community(
    data: CommunityCreate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    community_id = f"comm-{uuid.uuid4().hex[:8]}"
    community = Community(
        id=community_id, name=data.name, slug=data.slug,
        description=data.description, cover_url=data.cover_url,
        icon_emoji=data.icon_emoji, color=data.color, tags=data.tags,
        member_count=1,
    )
    db.add(community)
    member = CommunityMember(community_id=community_id, user_id=user_id, role="admin")
    db.add(member)
    await db.commit()
    await db.refresh(community)
    return CommunityResponse.model_validate(community)


@router.post("/{slug}/join")
async def join_community(
    slug: str, request: Request,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Community).where(Community.slug == slug))
    community = result.scalar_one_or_none()
    if not community:
        raise HTTPException(status_code=404, detail="Community not found")
    existing = await db.execute(
        select(CommunityMember).where(
            CommunityMember.community_id == community.id,
            CommunityMember.user_id == user_id,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Already a member")
    member = CommunityMember(community_id=community.id, user_id=user_id, role="member")
    db.add(member)
    community.member_count += 1
    await db.commit()

    kafka_producer = request.app.state.kafka_producer
    if kafka_producer is not None:
        await kafka_producer.send_and_wait("community.joined", {
            "user_id": user_id,
            "community_id": community.id,
            "community_name": community.name,
        })

    return {"status": "joined"}


@router.post("/{slug}/leave")
async def leave_community(
    slug: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Community).where(Community.slug == slug))
    community = result.scalar_one_or_none()
    if not community:
        raise HTTPException(status_code=404, detail="Community not found")
    member_result = await db.execute(
        select(CommunityMember).where(
            CommunityMember.community_id == community.id,
            CommunityMember.user_id == user_id,
        )
    )
    member = member_result.scalar_one_or_none()
    if not member:
        raise HTTPException(status_code=400, detail="Not a member")
    await db.delete(member)
    community.member_count = max(0, community.member_count - 1)
    await db.commit()
    return {"status": "left"}
