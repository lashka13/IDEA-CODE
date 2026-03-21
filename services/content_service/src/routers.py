from fastapi import APIRouter
from src.materials.routers import router as materials_router
from src.lessons.routers import router as lessons_router
from src.comments.routers import router as comments_router

router = APIRouter()
router.include_router(materials_router)
router.include_router(lessons_router)
router.include_router(comments_router)
