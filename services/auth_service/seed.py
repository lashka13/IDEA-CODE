"""
Seed script for auth_service.
Run: docker compose exec auth_service python seed.py
"""
import asyncio
import uuid
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select
from src.users.models import User
from src.utils import hash_password

DATABASE_URL = "postgresql+asyncpg://postgres:postgres@postgres:5432/auth_db"

USERS = [
    {
        "id": "user-alex01",
        "name": "Алексей Петров",
        "username": "alexdev",
        "email": "alex@example.com",
        "password": "password123",
        "bio": "Senior Frontend Developer. React и TypeScript — мой хлеб.",
        "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=alexdev",
        "rating": 4.8,
        "code_coins": 1250,
        "level": 12,
        "level_title": "Эксперт",
        "tech_stack": ["React", "TypeScript", "Go"],
        "skills": {"Frontend": 90, "Backend": 60, "DevOps": 30, "Data Science": 10, "Mobile": 20, "Security": 15},
        "uploads_count": 8,
        "purchases_count": 23,
    },
    {
        "id": "user-masha01",
        "name": "Мария Козлова",
        "username": "mashka_ds",
        "email": "masha@example.com",
        "password": "password123",
        "bio": "Data Scientist. Люблю находить паттерны в хаосе.",
        "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=mashka_ds",
        "rating": 4.6,
        "code_coins": 890,
        "level": 9,
        "level_title": "Продвинутый",
        "tech_stack": ["Python", "Pandas", "TensorFlow"],
        "skills": {"Frontend": 15, "Backend": 50, "DevOps": 20, "Data Science": 95, "Mobile": 5, "Security": 10},
        "uploads_count": 5,
        "purchases_count": 31,
    },
    {
        "id": "user-dima01",
        "name": "Дмитрий Волков",
        "username": "dima_devops",
        "email": "dima@example.com",
        "password": "password123",
        "bio": "DevOps-инженер. Контейнеризирую всё что движется.",
        "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=dima_devops",
        "rating": 4.9,
        "code_coins": 2100,
        "level": 15,
        "level_title": "Гуру",
        "tech_stack": ["Docker", "Kubernetes", "CI/CD"],
        "skills": {"Frontend": 10, "Backend": 70, "DevOps": 98, "Data Science": 20, "Mobile": 5, "Security": 60},
        "uploads_count": 14,
        "purchases_count": 18,
    },
    {
        "id": "user-anna01",
        "name": "Анна Сидорова",
        "username": "anna_mobile",
        "email": "anna@example.com",
        "password": "password123",
        "bio": "Mobile developer. Kotlin и Flutter — мой стек.",
        "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=anna_mobile",
        "rating": 4.3,
        "code_coins": 450,
        "level": 5,
        "level_title": "Новичок",
        "tech_stack": ["Kotlin", "Flutter", "Dart"],
        "skills": {"Frontend": 40, "Backend": 25, "DevOps": 10, "Data Science": 5, "Mobile": 85, "Security": 10},
        "uploads_count": 2,
        "purchases_count": 12,
    },
    {
        "id": "user-kirill01",
        "name": "Кирилл Новиков",
        "username": "kirill_ios",
        "email": "kirill@example.com",
        "password": "password123",
        "bio": "iOS Lead. Swift и архитектура мобильных приложений.",
        "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=kirill_ios",
        "rating": 4.8,
        "code_coins": 980,
        "level": 11,
        "level_title": "Эксперт",
        "tech_stack": ["Swift", "Kotlin", "SwiftUI"],
        "skills": {"Frontend": 30, "Backend": 40, "DevOps": 15, "Data Science": 5, "Mobile": 95, "Security": 20},
        "uploads_count": 6,
        "purchases_count": 15,
    },
    {
        "id": "user-elena01",
        "name": "Елена Смирнова",
        "username": "elena_sec",
        "email": "elena@example.com",
        "password": "password123",
        "bio": "Security Engineer. Пентест, аудит безопасности, защита инфраструктуры.",
        "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=elena_sec",
        "rating": 4.9,
        "code_coins": 1100,
        "level": 10,
        "level_title": "Продвинутый",
        "tech_stack": ["Python", "Bash", "Burp Suite"],
        "skills": {"Frontend": 10, "Backend": 45, "DevOps": 50, "Data Science": 15, "Mobile": 5, "Security": 95},
        "uploads_count": 4,
        "purchases_count": 20,
    },
]


async def seed():
    engine = create_async_engine(DATABASE_URL)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        created = 0
        skipped = 0
        for data in USERS:
            result = await session.execute(select(User).where(User.username == data["username"]))
            if result.scalar_one_or_none():
                print(f"  skip  {data['username']} (already exists)")
                skipped += 1
                continue

            user = User(
                id=data["id"],
                name=data["name"],
                username=data["username"],
                email=data["email"],
                hashed_password=hash_password(data["password"]),
                bio=data["bio"],
                avatar_url=data["avatar_url"],
                rating=data["rating"],
                code_coins=data["code_coins"],
                level=data["level"],
                level_title=data["level_title"],
                tech_stack=data["tech_stack"],
                skills=data["skills"],
                uploads_count=data["uploads_count"],
                purchases_count=data["purchases_count"],
                achievement_ids=["ach-1"],
            )
            session.add(user)
            print(f"  create {data['username']}")
            created += 1

        await session.commit()
        print(f"\nDone: {created} created, {skipped} skipped")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed())
