from fastapi import APIRouter
from src.users.routers import router as users_router

router = APIRouter()
router.include_router(users_router)
