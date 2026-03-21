import uuid
import json
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db, async_session
from models.user import User
from models.chat import ChatChannel, ChatMessage, MessageReaction
from schemas.chat import ChatChannelResponse, ChatMessageCreate, ChatMessageResponse, MessageReactionCreate
from services.auth import get_current_user, decode_token

router = APIRouter(tags=["chat"])


# WebSocket connection manager
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
                await connection.send_json(message)


manager = ConnectionManager()


# REST endpoints
@router.get("/chat/channels", response_model=list[ChatChannelResponse])
async def get_channels(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ChatChannel).order_by(ChatChannel.created_at))
    return [ChatChannelResponse.model_validate(c) for c in result.scalars().all()]


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
            id=msg.id,
            channel_id=msg.channel_id,
            author_id=msg.author_id,
            text=msg.text,
            reply_to_id=msg.reply_to_id,
            reactions=reactions,
            created_at=msg.created_at,
        ))
    return response


@router.post("/chat/channels/{channel_id}/messages", response_model=ChatMessageResponse, status_code=201)
async def send_message(
    channel_id: str,
    data: ChatMessageCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    msg = ChatMessage(
        id=f"msg-{uuid.uuid4().hex[:8]}",
        channel_id=channel_id,
        author_id=current_user.id,
        text=data.text,
        reply_to_id=data.reply_to_id,
    )
    db.add(msg)
    await db.commit()
    await db.refresh(msg)

    response = ChatMessageResponse(
        id=msg.id,
        channel_id=msg.channel_id,
        author_id=msg.author_id,
        text=msg.text,
        reply_to_id=msg.reply_to_id,
        reactions=[],
        created_at=msg.created_at,
    )

    # Broadcast to WebSocket clients
    await manager.broadcast(channel_id, {
        "type": "new_message",
        "data": response.model_dump(mode="json"),
    })

    return response


@router.post("/chat/messages/{message_id}/reactions")
async def toggle_reaction(
    message_id: str,
    data: MessageReactionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Check existing reaction
    result = await db.execute(
        select(MessageReaction).where(
            MessageReaction.message_id == message_id,
            MessageReaction.user_id == current_user.id,
            MessageReaction.emoji == data.emoji,
        )
    )
    existing = result.scalar_one_or_none()

    if existing:
        await db.delete(existing)
        added = False
    else:
        reaction = MessageReaction(
            message_id=message_id,
            user_id=current_user.id,
            emoji=data.emoji,
        )
        db.add(reaction)
        added = True

    await db.commit()
    return {"added": added}


# WebSocket endpoint
@router.websocket("/ws/chat/{channel_id}")
async def websocket_endpoint(websocket: WebSocket, channel_id: str):
    # Authenticate via query param
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

                await manager.broadcast(channel_id, {
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
                })
    except WebSocketDisconnect:
        manager.disconnect(websocket, channel_id)
