from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from config import get_settings
from database import engine, Base
from routers import auth, users, materials, communities, comments, posts
from routers import transactions, achievements, lessons, notifications, chat, upload

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables on startup
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield


app = FastAPI(
    title="IT-RE:SOURCE API",
    description="Backend API for IT-RE:SOURCE educational platform",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files for uploads
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Routers
app.include_router(auth.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(materials.router, prefix="/api")
app.include_router(communities.router, prefix="/api")
app.include_router(comments.router, prefix="/api")
app.include_router(posts.router, prefix="/api")
app.include_router(transactions.router, prefix="/api")
app.include_router(achievements.router, prefix="/api")
app.include_router(lessons.router, prefix="/api")
app.include_router(notifications.router, prefix="/api")
app.include_router(chat.router, prefix="/api")
app.include_router(upload.router, prefix="/api")


@app.get("/")
async def root():
    return {"message": "IT-RE:SOURCE API", "version": "1.0.0"}


@app.get("/health")
async def health():
    return {"status": "ok"}
