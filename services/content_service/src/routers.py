from fastapi import APIRouter
from src.materials.routers import router as materials_router
from src.lessons.routers import router as lessons_router
from src.comments.routers import router as comments_router
from src.tasks.routers import router as tasks_router
from src.challenges.routers import router as challenges_router
from src.schedule.routers import router as schedule_router
from src.roadmap.routers import router as roadmap_router

router = APIRouter()
router.include_router(materials_router)
router.include_router(lessons_router)
router.include_router(comments_router)
router.include_router(tasks_router)
router.include_router(challenges_router)
router.include_router(schedule_router)
router.include_router(roadmap_router)
