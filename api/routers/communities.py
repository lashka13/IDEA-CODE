import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from models.user import User
from models.community import Community, CommunityMember
from schemas.community import CommunityCreate, CommunityResponse, CommunityDetailResponse
from services.auth import get_current_user, get_optional_user

router = APIRouter(prefix="/communities", tags=["communities"])


@router.get("/", response_model=list[CommunityResponse])
async def get_communities(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Community).order_by(Community.activity_score.desc()))
    communities = result.scalars().all()
    return [CommunityResponse.model_validate(c) for c in communities]


@router.get("/{slug}", response_model=CommunityDetailResponse)
async def get_community(
    slug: str,
    current_user: User | None = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Community).where(Community.slug == slug))
    community = result.scalar_one_or_none()
    if not community:
        raise HTTPException(status_code=404, detail="Community not found")

    is_member = False
    if current_user:
        member_result = await db.execute(
            select(CommunityMember).where(
                CommunityMember.community_id == community.id,
                CommunityMember.user_id == current_user.id,
            )
        )
        is_member = member_result.scalar_one_or_none() is not None

    resp = CommunityDetailResponse.model_validate(community)
    resp.is_member = is_member
    return resp


@router.post("/", response_model=CommunityResponse, status_code=201)
async def create_community(
    data: CommunityCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    community_id = f"comm-{uuid.uuid4().hex[:8]}"
    community = Community(
        id=community_id,
        name=data.name,
        slug=data.slug,
        description=data.description,
        cover_url=data.cover_url,
        icon_emoji=data.icon_emoji,
        color=data.color,
        tags=data.tags,
        member_count=1,
    )
    db.add(community)

    # Creator becomes admin
    member = CommunityMember(
        community_id=community_id,
        user_id=current_user.id,
        role="admin",
    )
    db.add(member)

    await db.commit()
    await db.refresh(community)
    return CommunityResponse.model_validate(community)


@router.post("/{slug}/join")
async def join_community(
    slug: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Community).where(Community.slug == slug))
    community = result.scalar_one_or_none()
    if not community:
        raise HTTPException(status_code=404, detail="Community not found")

    existing = await db.execute(
        select(CommunityMember).where(
            CommunityMember.community_id == community.id,
            CommunityMember.user_id == current_user.id,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Already a member")

    member = CommunityMember(
        community_id=community.id,
        user_id=current_user.id,
        role="member",
    )
    db.add(member)
    community.member_count += 1
    await db.commit()
    return {"status": "joined"}


@router.post("/{slug}/leave")
async def leave_community(
    slug: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Community).where(Community.slug == slug))
    community = result.scalar_one_or_none()
    if not community:
        raise HTTPException(status_code=404, detail="Community not found")

    member_result = await db.execute(
        select(CommunityMember).where(
            CommunityMember.community_id == community.id,
            CommunityMember.user_id == current_user.id,
        )
    )
    member = member_result.scalar_one_or_none()
    if not member:
        raise HTTPException(status_code=400, detail="Not a member")

    await db.delete(member)
    community.member_count = max(0, community.member_count - 1)
    await db.commit()
    return {"status": "left"}
