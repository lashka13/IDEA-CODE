from fastapi import APIRouter
from src.channels.routers import router as channels_router
from src.messages.routers import router as messages_router

router = APIRouter()
router.include_router(channels_router)
router.include_router(messages_router)
