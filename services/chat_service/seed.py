"""
Seed script for chat_service.
Run: docker cp services/chat_service/seed.py services-chat_service-1:/app/seed.py && docker exec services-chat_service-1 python seed.py
"""
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select
from src.channels.models import ChatChannel
from src.messages.models import ChatMessage

DATABASE_URL = "postgresql+asyncpg://postgres:postgres@postgres:5432/chat_db"

CHANNELS = [
    {
        "id": "chan-general",
        "name": "general",
        "description": "Общий чат для всех участников",
        "icon": "💬",
        "is_general": True,
        "messages": [
            {"id": "msg-01", "author_id": "user-dima01", "text": "Всем привет! Рад видеть вас здесь 👋"},
            {"id": "msg-02", "author_id": "user-alex01", "text": "Привет! Отличная платформа, только зарегистрировался"},
            {"id": "msg-03", "author_id": "user-masha01", "text": "Здесь можно обсуждать курсы и задавать вопросы?"},
            {"id": "msg-04", "author_id": "user-dima01", "text": "Да, именно! Плюс есть тематические каналы по технологиям"},
            {"id": "msg-05", "author_id": "user-anna01", "text": "Отлично! Уже нашла канал по Flutter 🎉"},
        ],
    },
    {
        "id": "chan-react",
        "name": "react-frontend",
        "description": "Обсуждение React, TypeScript и всего фронтенда",
        "icon": "⚛️",
        "is_general": False,
        "messages": [
            {"id": "msg-10", "author_id": "user-alex01", "text": "React 19 вышел, кто уже попробовал новые фичи?"},
            {"id": "msg-11", "author_id": "user-masha01", "text": "Server Components наконец-то стабильные!"},
            {"id": "msg-12", "author_id": "user-alex01", "text": "Да, и use() хук очень удобный для промисов"},
        ],
    },
    {
        "id": "chan-devops",
        "name": "devops-cloud",
        "description": "Docker, Kubernetes, CI/CD и облачные платформы",
        "icon": "🐳",
        "is_general": False,
        "messages": [
            {"id": "msg-20", "author_id": "user-dima01", "text": "Кто использует Kubernetes в продакшне? Какие грабли?"},
            {"id": "msg-21", "author_id": "user-alex01", "text": "Мы на k3s — легче чем полный K8s, хватает для наших задач"},
            {"id": "msg-22", "author_id": "user-dima01", "text": "Хороший вариант для небольших команд 👍"},
        ],
    },
    {
        "id": "chan-jobs",
        "name": "jobs",
        "description": "Вакансии, резюме и карьерные вопросы",
        "icon": "💼",
        "is_general": False,
        "messages": [
            {"id": "msg-30", "author_id": "user-masha01", "text": "Ищем Data Scientist в команду, пишите в личку!"},
            {"id": "msg-31", "author_id": "user-anna01", "text": "А Junior Flutter тоже нужны?"},
            {"id": "msg-32", "author_id": "user-masha01", "text": "У нас нет мобильной разработки, но могу порекомендовать другие компании"},
        ],
    },
]


async def seed():
    engine = create_async_engine(DATABASE_URL)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        ch_created = 0
        msg_created = 0

        for data in CHANNELS:
            result = await session.execute(select(ChatChannel).where(ChatChannel.id == data["id"]))
            if result.scalar_one_or_none():
                print(f"  skip  channel: #{data['name']}")
                continue

            messages_data = data.pop("messages")
            channel = ChatChannel(**data)
            session.add(channel)
            ch_created += 1
            print(f"  create channel: #{data['name']}")

            for m in messages_data:
                msg = ChatMessage(channel_id=data["id"], **m)
                session.add(msg)
                msg_created += 1

        await session.commit()
        print(f"\nDone: {ch_created} channels, {msg_created} messages created")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed())
