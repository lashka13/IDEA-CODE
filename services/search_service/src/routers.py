from fastapi import APIRouter
from src.documents.routers import router as documents_router
from src.search.routers import router as search_router
from src.assistant.routers import router as assistant_router

router = APIRouter(prefix="/search")
router.include_router(search_router)
router.include_router(documents_router)
router.include_router(assistant_router)
