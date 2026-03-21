import os

# ChromaDB reads this at import time; helps avoid noisy PostHog telemetry errors in logs.
os.environ.setdefault("ANONYMIZED_TELEMETRY", "False")

import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.conf import get_settings
from src.db import engine, Base
from src.routers import router as api_router
from src.indexer.bm25_index import BM25Index
from src.indexer.vector_index import VectorIndex
from src.indexer.sync_content import sync_content_on_startup
from src.indexer.kafka_listener import start_kafka_consumer

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    app.state.bm25_index = BM25Index()
    if not settings.OPENROUTER_API_KEY:
        logger.warning(
            "OPENROUTER_API_KEY is empty: semantic search (embeddings) will fail or degrade. "
            "Set it in services/.env — embeddings use OpenRouter /v1/embeddings."
        )
    app.state.vector_index = VectorIndex(
        persist_dir=settings.CHROMA_PERSIST_DIR,
        hf_api_key=settings.HUGGINGFACE_API_KEY,
        model_name=settings.EMBEDDING_MODEL,
        openrouter_api_key=settings.OPENROUTER_API_KEY,
    )

    await sync_content_on_startup(app)

    consumer_task = asyncio.create_task(start_kafka_consumer(app))

    yield

    consumer_task.cancel()


app = FastAPI(title="Search Service", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api")


@app.get("/health")
async def health():
    return {"status": "ok", "service": "search"}
