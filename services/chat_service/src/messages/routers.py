import uuid
import json
import logging
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import redis.asyncio as aioredis

from src.db import get_db, async_session
from src.utils import get_current_user_id, decode_token
from src.messages.models import ChatMessage, MessageReaction
from src.messages.schemas import ChatMessageCreate, ChatMessageResponse, MessageReactionCreate
from src.conf import get_settings

logger = logging.getLogger(__name__)
router = APIRouter(tags=["chat"])
settings = get_settings()


# ── WebSocket Connection Manager with Redis Pub/Sub ───────
class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, list[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, channel_id: str):
        await websocket.accept()
        if channel_id not in self.active_connections:
            self.active_connections[channel_id] = []
        self.active_connections[channel_id].append(websocket)

    def disconnect(self, websocket: WebSocket, channel_id: str):
        if channel_id in self.active_connections:
            self.active_connections[channel_id].remove(websocket)

    async def broadcast(self, channel_id: str, message: dict):
        if channel_id in self.active_connections:
            for connection in self.active_connections[channel_id]:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    logger.warning(f"Failed to send message to WebSocket: {e}")


manager = ConnectionManager()


# ── REST Endpoints ────────────────────────────────────────
@router.get("/chat/channels/{channel_id}/messages", response_model=list[ChatMessageResponse])
async def get_messages(
    channel_id: str,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.channel_id == channel_id)
        .order_by(ChatMessage.created_at.desc())
        .limit(limit)
    )
    messages = result.scalars().all()

    response = []
    for msg in reversed(messages):
        reactions = [
            {"emoji": r.emoji, "user_id": r.user_id}
            for r in msg.reactions
        ]
        response.append(ChatMessageResponse(
            id=msg.id, channel_id=msg.channel_id, author_id=msg.author_id,
            text=msg.text, reply_to_id=msg.reply_to_id,
            reactions=reactions, created_at=msg.created_at,
        ))
    return response


@router.post("/chat/channels/{channel_id}/messages", response_model=ChatMessageResponse, status_code=201)
async def send_message(
    channel_id: str,
    data: ChatMessageCreate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    msg = ChatMessage(
        id=f"msg-{uuid.uuid4().hex[:8]}",
        channel_id=channel_id,
        author_id=user_id,
        text=data.text,
        reply_to_id=data.reply_to_id,
    )
    db.add(msg)
    await db.commit()
    await db.refresh(msg)

    response = ChatMessageResponse(
        id=msg.id, channel_id=msg.channel_id, author_id=msg.author_id,
        text=msg.text, reply_to_id=msg.reply_to_id,
        reactions=[], created_at=msg.created_at,
    )

    # Broadcast via local manager
    await manager.broadcast(channel_id, {
        "type": "new_message",
        "data": response.model_dump(mode="json"),
    })

    # Publish to Redis for cross-instance broadcasting
    r = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
    await r.publish(f"chat:{channel_id}", json.dumps({
        "type": "new_message",
        "data": response.model_dump(mode="json"),
    }))
    await r.close()

    return response


@router.post("/chat/messages/{message_id}/reactions")
async def toggle_reaction(
    message_id: str,
    data: MessageReactionCreate,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(MessageReaction).where(
            MessageReaction.message_id == message_id,
            MessageReaction.user_id == user_id,
            MessageReaction.emoji == data.emoji,
        )
    )
    existing = result.scalar_one_or_none()

    if existing:
        await db.delete(existing)
        added = False
    else:
        reaction = MessageReaction(
            message_id=message_id, user_id=user_id, emoji=data.emoji,
        )
        db.add(reaction)
        added = True

    await db.commit()
    return {"added": added}


# ── WebSocket Endpoint ────────────────────────────────────
@router.websocket("/ws/chat/{channel_id}")
async def websocket_endpoint(websocket: WebSocket, channel_id: str):
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=4001)
        return

    user_id = decode_token(token)
    if not user_id:
        await websocket.close(code=4001)
        return

    await manager.connect(websocket, channel_id)
    try:
        while True:
            data = await websocket.receive_text()
            msg_data = json.loads(data)

            async with async_session() as db:
                msg = ChatMessage(
                    id=f"msg-{uuid.uuid4().hex[:8]}",
                    channel_id=channel_id,
                    author_id=user_id,
                    text=msg_data.get("text", ""),
                    reply_to_id=msg_data.get("reply_to_id"),
                )
                db.add(msg)
                await db.commit()
                await db.refresh(msg)

                broadcast_data = {
                    "type": "new_message",
                    "data": {
                        "id": msg.id,
                        "channel_id": msg.channel_id,
                        "author_id": msg.author_id,
                        "text": msg.text,
                        "reply_to_id": msg.reply_to_id,
                        "reactions": [],
                        "created_at": msg.created_at.isoformat(),
                    },
                }

                await manager.broadcast(channel_id, broadcast_data)

                # Publish to Redis for cross-instance broadcasting
                r = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
                await r.publish(f"chat:{channel_id}", json.dumps(broadcast_data))
                await r.close()

    except WebSocketDisconnect:
        manager.disconnect(websocket, channel_id)
