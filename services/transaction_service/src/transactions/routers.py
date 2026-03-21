import httpx
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from src.db import get_db
from src.conf import get_settings
from src.utils import get_current_user_id
from src.transactions.models import Transaction
from src.transactions.schemas import TransactionResponse

router = APIRouter(prefix="/transactions", tags=["transactions"])
settings = get_settings()


@router.get("/", response_model=list[TransactionResponse])
async def get_my_transactions(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Transaction).where(Transaction.user_id == user_id).order_by(Transaction.created_at.desc())
    )
    return [TransactionResponse.model_validate(t) for t in result.scalars().all()]


@router.get("/balance")
async def get_balance(user_id: str = Depends(get_current_user_id)):
    """Get user balance from auth_service."""
    async with httpx.AsyncClient() as client:
        resp = await client.get(f"{settings.AUTH_SERVICE_URL}/api/internal/users/{user_id}")
        if resp.status_code != 200:
            raise HTTPException(status_code=502, detail="Failed to get user balance")
        user_data = resp.json()
        return {"code_coins": user_data.get("code_coins", 0)}
