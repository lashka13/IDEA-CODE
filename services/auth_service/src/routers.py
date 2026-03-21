from fastapi import APIRouter
from src.users.routers import router as users_router
from src.mentors.routers import router as mentors_router

router = APIRouter()
router.include_router(users_router)
router.include_router(mentors_router)
