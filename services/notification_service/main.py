import asyncio
import json
import logging
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
logger = logging.getLogger(__name__)


async def _kafka_producer_background(app: FastAPI) -> None:
    producer = AIOKafkaProducer(
        bootstrap_servers=settings.KAFKA_BOOTSTRAP_SERVERS,
        value_serializer=lambda v: json.dumps(v).encode(),
    )
    for attempt in range(60):
        try:
            await producer.start()
            app.state.kafka_producer = producer
            logger.info("Kafka producer ready (attempt %s)", attempt + 1)
            return
        except (asyncio.CancelledError, Exception) as e:
            if isinstance(e, asyncio.CancelledError):
                raise
            logger.warning("Kafka producer start attempt %s/60: %s", attempt + 1, e)
            await asyncio.sleep(2)
    logger.error("Kafka producer unavailable")


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    app.state.kafka_producer = None
    producer_task = asyncio.create_task(_kafka_producer_background(app))

    app.state.redis = aioredis.from_url(settings.REDIS_URL, decode_responses=True)

    consumer_task = asyncio.create_task(start_kafka_consumer(app))

    yield

    producer_task.cancel()
    try:
        await producer_task
    except asyncio.CancelledError:
        pass
    consumer_task.cancel()
    if app.state.kafka_producer is not None:
        await app.state.kafka_producer.stop()
    await app.state.redis.close()


app = FastAPI(title="Notification Service", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api")


@app.get("/health")
async def health():
    return {"status": "ok", "service": "notification"}
