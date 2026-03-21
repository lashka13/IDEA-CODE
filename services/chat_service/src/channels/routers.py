from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from src.db import get_db
from src.channels.models import ChatChannel
from src.channels.schemas import ChatChannelResponse

router = APIRouter(prefix="/chat/channels", tags=["chat"])


@router.get("/", response_model=list[ChatChannelResponse])
async def get_channels(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ChatChannel).order_by(ChatChannel.created_at))
    return [ChatChannelResponse.model_validate(c) for c in result.scalars().all()]
