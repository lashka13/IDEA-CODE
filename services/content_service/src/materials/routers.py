import uuid
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from src.db import get_db
from src.utils import get_current_user_id, get_optional_user_id
from src.materials.models import Material
from src.materials.schemas import MaterialCreate, MaterialResponse, MaterialUpdate, MaterialListResponse
from src.purchases.models import Purchase
from src.utils_pkg.service_clients import AuthServiceClient

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
    if search:
        query = query.where(or_(Material.title.ilike(f"%{search}%"), Material.description.ilike(f"%{search}%")))
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

    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    if sort_by == "popular":
        query = query.order_by(Material.purchase_count.desc())
    elif sort_by == "rating":
        query = query.order_by(Material.rating.desc())
    elif sort_by == "price-asc":
        query = query.order_by(Material.price.asc())
    elif sort_by == "price-desc":
        query = query.order_by(Material.price.desc())
    else:
        query = query.order_by(Material.created_at.desc())

    query = query.offset((page - 1) * per_page).limit(per_page)
    result = await db.execute(query)
    materials = result.scalars().all()

    return MaterialListResponse(
        items=[MaterialResponse.model_validate(m) for m in materials],
        total=total, page=page, per_page=per_page,
    )


@router.get("/popular", response_model=list[MaterialResponse])
async def get_popular_materials(limit: int = 8, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Material).order_by(Material.purchase_count.desc()).limit(limit))
    return [MaterialResponse.model_validate(m) for m in result.scalars().all()]


@router.get("/{material_id}", response_model=MaterialResponse)
async def get_material(material_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Material).where(Material.id == material_id))
    material = result.scalar_one_or_none()
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")
    return MaterialResponse.model_validate(material)


@router.post("/", response_model=MaterialResponse, status_code=201)
async def create_material(
    data: MaterialCreate,
    request: Request,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    material_id = f"mat-{uuid.uuid4().hex[:8]}"
    material = Material(
        id=material_id, title=data.title, description=data.description,
        author_id=user_id, cover_url=data.cover_url, price=data.price,
        language=data.language, technology=data.technology, difficulty=data.difficulty,
        format=data.format, task_type=data.task_type, tags=data.tags,
        table_of_contents=data.table_of_contents, community_id=data.community_id,
        pdf_url=data.pdf_url,
    )
    db.add(material)
    await db.commit()
    await db.refresh(material)

    kafka_producer = request.app.state.kafka_producer
    if kafka_producer is not None:
        await kafka_producer.send_and_wait("material.created", {
            "material_id": material_id, "author_id": user_id, "title": data.title,
        })

    return MaterialResponse.model_validate(material)


@router.patch("/{material_id}", response_model=MaterialResponse)
async def update_material(
    material_id: str,
    data: MaterialUpdate,
    request: Request,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Material).where(Material.id == material_id))
    material = result.scalar_one_or_none()
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")
    if material.author_id != user_id:
        raise HTTPException(status_code=403, detail="Not your material")
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(material, field, value)
    await db.commit()
    await db.refresh(material)

    kafka_producer = request.app.state.kafka_producer
    if kafka_producer is not None:
        await kafka_producer.send_and_wait("material.updated", {"material_id": material_id})

    return MaterialResponse.model_validate(material)


@router.delete("/{material_id}", status_code=204)
async def delete_material(
    material_id: str,
    request: Request,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Material).where(Material.id == material_id))
    material = result.scalar_one_or_none()
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")
    if material.author_id != user_id:
        raise HTTPException(status_code=403, detail="Not your material")
    await db.delete(material)
    await db.commit()

    kafka_producer = request.app.state.kafka_producer
    if kafka_producer is not None:
        await kafka_producer.send_and_wait("material.deleted", {"material_id": material_id})


@router.post("/{material_id}/purchase", response_model=MaterialResponse)
async def purchase_material(
    material_id: str,
    request: Request,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    # Check if already purchased
    existing = await db.execute(
        select(Purchase).where(Purchase.user_id == user_id, Purchase.material_id == material_id)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Already purchased")

    result = await db.execute(select(Material).where(Material.id == material_id))
    material = result.scalar_one_or_none()
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")
    if material.author_id == user_id:
        raise HTTPException(status_code=400, detail="Can't buy your own material")

    # Deduct coins from buyer via auth_service
    auth_client = AuthServiceClient()
    await auth_client.deduct_coins(user_id, material.price, f"Покупка: {material.title}")
    # Add coins to seller via auth_service
    await auth_client.add_coins(material.author_id, material.price, f"Продажа: {material.title}")

    # Create purchase record
    purchase = Purchase(user_id=user_id, material_id=material.id, price_paid=material.price)
    db.add(purchase)
    material.purchase_count += 1
    await db.commit()
    await db.refresh(material)

    # Produce Kafka event
    kafka_producer = request.app.state.kafka_producer
    if kafka_producer is not None:
        await kafka_producer.send_and_wait("material.purchased", {
            "buyer_id": user_id,
            "seller_id": material.author_id,
            "material_id": material.id,
            "material_title": material.title,
            "price": material.price,
        })

    return MaterialResponse.model_validate(material)


@router.get("/{material_id}/is-purchased")
async def is_purchased(
    material_id: str,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Purchase).where(Purchase.user_id == user_id, Purchase.material_id == material_id)
    )
    return {"purchased": result.scalar_one_or_none() is not None}
