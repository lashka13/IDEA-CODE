import asyncio
import json
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from aiokafka import AIOKafkaProducer
import redis.asyncio as aioredis

from src.conf import get_settings
from src.db import engine, Base
from src.routers import router as api_router
from kafka_consumer import start_kafka_consumer

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    app.state.kafka_producer = AIOKafkaProducer(
        bootstrap_servers=settings.KAFKA_BOOTSTRAP_SERVERS,
        value_serializer=lambda v: json.dumps(v).encode(),
    )
    await app.state.kafka_producer.start()

    app.state.redis = aioredis.from_url(settings.REDIS_URL, decode_responses=True)

    consumer_task = asyncio.create_task(start_kafka_consumer(app))

    yield

    consumer_task.cancel()
    await app.state.kafka_producer.stop()
    await app.state.redis.close()


app = FastAPI(title="Community Service", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api")


@app.get("/health")
async def health():
    return {"status": "ok", "service": "community"}
