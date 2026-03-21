import uuid
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from database import get_db
from models.user import User
from models.material import Material
from models.purchase import Purchase
from schemas.material import MaterialCreate, MaterialResponse, MaterialUpdate, MaterialListResponse
from services.auth import get_current_user, get_optional_user
from services.coins import transfer_coins

router = APIRouter(prefix="/materials", tags=["materials"])


@router.get("/", response_model=MaterialListResponse)
async def get_materials(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    search: str | None = None,
    language: str | None = None,
    difficulty: str | None = None,
    format: str | None = None,
    task_type: str | None = None,
    community_id: str | None = None,
    sort_by: str = "popular",
    db: AsyncSession = Depends(get_db),
):
    query = select(Material)

    # Filters
    if search:
        query = query.where(
            or_(
                Material.title.ilike(f"%{search}%"),
                Material.description.ilike(f"%{search}%"),
            )
        )
    if language:
        for lang in language.split(","):
            query = query.where(Material.language == lang.strip())
    if difficulty:
        for diff in difficulty.split(","):
            query = query.where(Material.difficulty == diff.strip())
    if format:
        for fmt in format.split(","):
            query = query.where(Material.format == fmt.strip())
    if task_type:
        for tt in task_type.split(","):
            query = query.where(Material.task_type == tt.strip())
    if community_id:
        query = query.where(Material.community_id == community_id)

    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Sort
    if sort_by == "popular":
        query = query.order_by(Material.purchase_count.desc())
    elif sort_by == "rating":
        query = query.order_by(Material.rating.desc())
    elif sort_by == "price-asc":
        query = query.order_by(Material.price.asc())
    elif sort_by == "price-desc":
        query = query.order_by(Material.price.desc())
    elif sort_by == "date":
        query = query.order_by(Material.created_at.desc())
    else:
        query = query.order_by(Material.created_at.desc())

    # Pagination
    query = query.offset((page - 1) * per_page).limit(per_page)
    result = await db.execute(query)
    materials = result.scalars().all()

    return MaterialListResponse(
        items=[MaterialResponse.model_validate(m) for m in materials],
        total=total,
        page=page,
        per_page=per_page,
    )


@router.get("/my-purchases", response_model=list[MaterialResponse])
async def get_my_purchases(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Material)
        .join(Purchase, Purchase.material_id == Material.id)
        .where(Purchase.user_id == current_user.id)
        .order_by(Purchase.created_at.desc())
    )
    return [MaterialResponse.model_validate(m) for m in result.scalars().all()]


@router.get("/popular", response_model=list[MaterialResponse])
async def get_popular_materials(limit: int = 8, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Material).order_by(Material.purchase_count.desc()).limit(limit)
    )
    return [MaterialResponse.model_validate(m) for m in result.scalars().all()]


@router.get("/{material_id}", response_model=MaterialResponse)
async def get_material(material_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Material).where(Material.id == material_id))
    material = result.scalar_one_or_none()
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")
    return MaterialResponse.model_validate(material)


async def _auto_index_material(material_id: str, db: AsyncSession) -> None:
    """Background task: index newly created material into the AI vector store."""
    try:
        from routers.ai import _index_single_material, _rebuild_bm25
        result = await db.execute(select(Material).where(Material.id == material_id))
        mat = result.scalar_one_or_none()
        if mat:
            await _index_single_material(mat)
            await _rebuild_bm25(db)
    except Exception:
        pass  # indexing is best-effort — never fail the main request


@router.post("/", response_model=MaterialResponse, status_code=201)
async def create_material(
    data: MaterialCreate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    material_id = f"mat-{uuid.uuid4().hex[:8]}"
    material = Material(
        id=material_id,
        title=data.title,
        description=data.description,
        author_id=current_user.id,
        cover_url=data.cover_url,
        content_url=data.content_url,
        price=data.price,
        language=data.language,
        technology=data.technology,
        difficulty=data.difficulty,
        format=data.format,
        task_type=data.task_type,
        tags=data.tags,
        table_of_contents=data.table_of_contents,
        community_id=data.community_id,
    )
    db.add(material)
    current_user.uploads_count += 1
    await db.commit()
    await db.refresh(material)

    # Automatically index this material so it's searchable right away
    background_tasks.add_task(_auto_index_material, material_id, db)

    return MaterialResponse.model_validate(material)


@router.patch("/{material_id}", response_model=MaterialResponse)
async def update_material(
    material_id: str,
    data: MaterialUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Material).where(Material.id == material_id))
    material = result.scalar_one_or_none()
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")
    if material.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your material")

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(material, field, value)
    await db.commit()
    await db.refresh(material)
    return MaterialResponse.model_validate(material)


@router.delete("/{material_id}", status_code=204)
async def delete_material(
    material_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Material).where(Material.id == material_id))
    material = result.scalar_one_or_none()
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")
    if material.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your material")
    await db.delete(material)
    current_user.uploads_count -= 1
    await db.commit()


@router.post("/{material_id}/purchase", response_model=MaterialResponse)
async def purchase_material(
    material_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Check if already purchased
    existing = await db.execute(
        select(Purchase).where(
            Purchase.user_id == current_user.id,
            Purchase.material_id == material_id,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Already purchased")

    # Get material
    result = await db.execute(select(Material).where(Material.id == material_id))
    material = result.scalar_one_or_none()
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")

    # Can't buy own material
    if material.author_id == current_user.id:
        raise HTTPException(status_code=400, detail="Can't buy your own material")

    # Check balance
    if current_user.code_coins < material.price:
        raise HTTPException(status_code=400, detail="Insufficient CodeCoins")

    # Get seller
    seller_result = await db.execute(select(User).where(User.id == material.author_id))
    seller = seller_result.scalar_one()

    # Transfer coins
    await transfer_coins(db, current_user, seller, material.price, material.title, material.id)

    # Create purchase record
    purchase = Purchase(
        user_id=current_user.id,
        material_id=material.id,
        price_paid=material.price,
    )
    db.add(purchase)

    # Update material stats
    material.purchase_count += 1

    await db.commit()
    await db.refresh(material)
    return MaterialResponse.model_validate(material)


@router.get("/{material_id}/is-purchased")
async def is_purchased(
    material_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Purchase).where(
            Purchase.user_id == current_user.id,
            Purchase.material_id == material_id,
        )
    )
    return {"purchased": result.scalar_one_or_none() is not None}
