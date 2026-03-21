from fastapi import APIRouter
from src.communities.routers import router as communities_router
from src.posts.routers import router as posts_router
from src.projects.routers import router as projects_router

router = APIRouter()
router.include_router(communities_router)
router.include_router(posts_router)
router.include_router(projects_router)
