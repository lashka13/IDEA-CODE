import json
import logging
from aiokafka import AIOKafkaConsumer
from sqlalchemy import select
from src.db import async_session
from src.users.models import User
from src.conf import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


async def start_kafka_consumer(app):
    consumer = AIOKafkaConsumer(
        "achievement.unlocked",
        bootstrap_servers=settings.KAFKA_BOOTSTRAP_SERVERS,
        group_id="auth-service",
        value_deserializer=lambda m: json.loads(m.decode()),
    )
    await consumer.start()
    app.state.kafka_consumer = consumer
    try:
        async for msg in consumer:
            try:
                await handle_message(msg.topic, msg.value)
            except Exception as e:
                logger.error(f"Error handling message {msg.topic}: {e}")
    finally:
        await consumer.stop()


async def handle_message(topic: str, data: dict):
    if topic == "achievement.unlocked":
        await handle_achievement_unlocked(data)


async def handle_achievement_unlocked(data: dict):
    user_id = data.get("user_id")
    achievement_id = data.get("achievement_id")
    if not user_id or not achievement_id:
        return
    async with async_session() as db:
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if user and achievement_id not in user.achievement_ids:
            new_ids = user.achievement_ids + [achievement_id]
            user.achievement_ids = new_ids
            await db.commit()
            logger.info(f"Added achievement {achievement_id} to user {user_id}")
