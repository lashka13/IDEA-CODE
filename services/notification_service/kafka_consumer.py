import json
import uuid
import logging
from aiokafka import AIOKafkaConsumer
from src.db import async_session
from src.notifications.models import Notification
from src.conf import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


async def start_kafka_consumer(app):
    consumer = AIOKafkaConsumer(
        "user.registered",
        "material.purchased",
        "comment.created",
        "community.joined",
        "achievement.unlocked",
        bootstrap_servers=settings.KAFKA_BOOTSTRAP_SERVERS,
        group_id="notification-service",
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
    if topic == "user.registered":
        await handle_user_registered(data)
    elif topic == "material.purchased":
        await handle_material_purchased(data)
    elif topic == "comment.created":
        await handle_comment_created(data)
    elif topic == "community.joined":
        await handle_community_joined(data)
    elif topic == "achievement.unlocked":
        await handle_achievement_unlocked(data)


async def handle_user_registered(data: dict):
    """Welcome notification for new user."""
    user_id = data.get("user_id")
    bonus = data.get("bonus", 50)
    async with async_session() as db:
        notif = Notification(
            id=f"notif-{uuid.uuid4().hex[:8]}",
            user_id=user_id,
            type="achievement",
            title="Добро пожаловать!",
            message=f"Вы получили {bonus} CodeCoins в подарок!",
            link="/wallet",
        )
        db.add(notif)
        await db.commit()
        logger.info(f"Welcome notification created for user {user_id}")


async def handle_material_purchased(data: dict):
    """Notification to seller about new sale."""
    seller_id = data.get("seller_id")
    material_title = data.get("material_title")
    price = data.get("price")
    material_id = data.get("material_id")
    async with async_session() as db:
        notif = Notification(
            id=f"notif-{uuid.uuid4().hex[:8]}",
            user_id=seller_id,
            type="sale",
            title="Новая продажа!",
            message=f'Ваш материал "{material_title}" был куплен за {price} CodeCoins',
            link=f"/catalog/{material_id}",
        )
        db.add(notif)
        await db.commit()
        logger.info(f"Sale notification created for seller {seller_id}")


async def handle_comment_created(data: dict):
    """Notification to material author about new comment."""
    material_author_id = data.get("material_author_id")
    author_id = data.get("author_id")
    material_title = data.get("material_title")
    material_id = data.get("material_id")
    rating = data.get("rating")
    # Don't notify if commenting on own material
    if material_author_id == author_id:
        return
    async with async_session() as db:
        notif = Notification(
            id=f"notif-{uuid.uuid4().hex[:8]}",
            user_id=material_author_id,
            type="comment",
            title="Новый отзыв!",
            message=f'Новый отзыв на "{material_title}" с оценкой {rating}',
            link=f"/catalog/{material_id}",
        )
        db.add(notif)
        await db.commit()
        logger.info(f"Comment notification created for author {material_author_id}")


async def handle_community_joined(data: dict):
    """Notification to user about joining community."""
    user_id = data.get("user_id")
    community_name = data.get("community_name")
    community_id = data.get("community_id")
    async with async_session() as db:
        notif = Notification(
            id=f"notif-{uuid.uuid4().hex[:8]}",
            user_id=user_id,
            type="community",
            title="Вы присоединились к сообществу!",
            message=f'Вы стали участником "{community_name}"',
            link=f"/communities/{community_id}",
        )
        db.add(notif)
        await db.commit()
        logger.info(f"Community join notification for user {user_id}")


async def handle_achievement_unlocked(data: dict):
    """Notification about unlocked achievement."""
    user_id = data.get("user_id")
    achievement_id = data.get("achievement_id")
    async with async_session() as db:
        notif = Notification(
            id=f"notif-{uuid.uuid4().hex[:8]}",
            user_id=user_id,
            type="achievement",
            title="Новое достижение!",
            message=f"Вы разблокировали достижение!",
            link="/achievements",
        )
        db.add(notif)
        await db.commit()
        logger.info(f"Achievement notification for user {user_id}")
