import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from models.user import User
from models.transaction import Transaction
from models.notification import Notification


async def transfer_coins(
    db: AsyncSession,
    buyer: User,
    seller: User,
    amount: int,
    material_title: str,
    material_id: str,
) -> None:
    """Transfer CodeCoins from buyer to seller, create transactions and notifications."""
    # Deduct from buyer
    buyer.code_coins -= amount
    buyer.purchases_count += 1

    # Add to seller (author gets full price)
    seller.code_coins += amount
    seller.uploads_count = seller.uploads_count  # keep as is

    # Create buyer transaction
    buy_tx = Transaction(
        id=f"tx-{uuid.uuid4().hex[:8]}",
        user_id=buyer.id,
        type="purchase",
        amount=-amount,
        description=f"Покупка: {material_title}",
        material_id=material_id,
    )
    db.add(buy_tx)

    # Create seller transaction
    sell_tx = Transaction(
        id=f"tx-{uuid.uuid4().hex[:8]}",
        user_id=seller.id,
        type="sale",
        amount=amount,
        description=f"Продажа: {material_title}",
        material_id=material_id,
    )
    db.add(sell_tx)

    # Notify seller
    notif = Notification(
        id=f"notif-{uuid.uuid4().hex[:8]}",
        user_id=seller.id,
        type="sale",
        title="Новая продажа!",
        message=f'Пользователь {buyer.name} купил "{material_title}" за {amount} CodeCoins',
        link=f"/catalog/{material_id}",
    )
    db.add(notif)

    await db.flush()
