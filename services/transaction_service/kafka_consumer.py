import json
import uuid
import logging
from aiokafka import AIOKafkaConsumer
from src.db import async_session
from src.transactions.models import Transaction
from src.achievements.models import UserAchievement
from src.conf import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


async def start_kafka_consumer(app):
    consumer = AIOKafkaConsumer(
        "user.registered",
        "material.purchased",
        bootstrap_servers=settings.KAFKA_BOOTSTRAP_SERVERS,
        group_id="transaction-service",
        value_deserializer=lambda m: json.loads(m.decode()),
    )
    await consumer.start()
    app.state.kafka_consumer = consumer
    try:
        async for msg in consumer:
            try:
                await handle_message(msg.topic, msg.value, app)
            except Exception as e:
                logger.error(f"Error handling message {msg.topic}: {e}")
    finally:
        await consumer.stop()


async def handle_message(topic: str, data: dict, app):
    if topic == "user.registered":
        await handle_user_registered(data, app)
    elif topic == "material.purchased":
        await handle_material_purchased(data, app)


async def handle_user_registered(data: dict, app):
    """Create registration bonus transaction and first achievement."""
    user_id = data.get("user_id")
    bonus = data.get("bonus", 50)

    async with async_session() as db:
        # Registration bonus transaction
        tx = Transaction(
            id=f"tx-{uuid.uuid4().hex[:8]}",
            user_id=user_id,
            type="reward",
            amount=bonus,
            description="Бонус за регистрацию",
        )
        db.add(tx)

        # First achievement
        first_ach = UserAchievement(user_id=user_id, achievement_id="ach-1")
        db.add(first_ach)

        await db.commit()
        logger.info(f"Created registration bonus for user {user_id}")

    # Produce achievement.unlocked event
    kafka_producer = app.state.kafka_producer
    await kafka_producer.send_and_wait("achievement.unlocked", {
        "user_id": user_id,
        "achievement_id": "ach-1",
    })


async def handle_material_purchased(data: dict, app):
    """Create purchase and sale transactions."""
    buyer_id = data.get("buyer_id")
    seller_id = data.get("seller_id")
    material_id = data.get("material_id")
    material_title = data.get("material_title")
    price = data.get("price")

    async with async_session() as db:
        # Buyer transaction (debit)
        buy_tx = Transaction(
            id=f"tx-{uuid.uuid4().hex[:8]}",
            user_id=buyer_id,
            type="purchase",
            amount=-price,
            description=f"Покупка: {material_title}",
            material_id=material_id,
        )
        db.add(buy_tx)

        # Seller transaction (credit)
        sell_tx = Transaction(
            id=f"tx-{uuid.uuid4().hex[:8]}",
            user_id=seller_id,
            type="sale",
            amount=price,
            description=f"Продажа: {material_title}",
            material_id=material_id,
        )
        db.add(sell_tx)

        await db.commit()
        logger.info(f"Created purchase transactions for material {material_id}")
