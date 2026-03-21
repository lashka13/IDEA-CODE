from fastapi import APIRouter
from src.transactions.routers import router as transactions_router
from src.achievements.routers import router as achievements_router

router = APIRouter()
router.include_router(transactions_router)
router.include_router(achievements_router)
