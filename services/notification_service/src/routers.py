from fastapi import APIRouter
from src.notifications.routers import router as notifications_router

router = APIRouter()
router.include_router(notifications_router)
