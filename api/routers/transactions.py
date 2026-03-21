from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from models.user import User
from models.transaction import Transaction
from schemas.transaction import TransactionResponse
from services.auth import get_current_user

router = APIRouter(prefix="/transactions", tags=["transactions"])


@router.get("/", response_model=list[TransactionResponse])
async def get_my_transactions(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Transaction)
        .where(Transaction.user_id == current_user.id)
        .order_by(Transaction.created_at.desc())
    )
    return [TransactionResponse.model_validate(t) for t in result.scalars().all()]


@router.get("/balance")
async def get_balance(current_user: User = Depends(get_current_user)):
    return {"code_coins": current_user.code_coins}
