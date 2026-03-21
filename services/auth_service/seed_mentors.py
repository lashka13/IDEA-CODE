"""
Seed mentors for auth_service.
Run: docker cp services/auth_service/seed_mentors.py services-auth_service-1:/app/seed_mentors.py && docker exec services-auth_service-1 python seed_mentors.py
"""
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select
from src.mentors.models import MentorProfile

DATABASE_URL = "postgresql+asyncpg://postgres:postgres@postgres:5432/auth_db"

MENTORS = [
    {
        "id": "mentor-01",
        "user_id": "user-alex01",
        "name": "Алексей Козлов",
        "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=mentor1",
        "title": "Senior Frontend Engineer",
        "company": "Т-Банк",
        "experience": "8 лет",
        "bio": "Фронтенд-архитект с опытом в React, Vue и Angular. Помогу подготовиться к собеседованиям в топ-компании.",
        "tech_stack": ["React", "TypeScript", "Vue", "Next.js", "GraphQL"],
        "rating": 4.9,
        "review_count": 127,
        "sessions_completed": 89,
        "price_per_hour": 80,
        "available": True,
        "specializations": ["Подготовка к собеседованиям", "Code Review", "Архитектура фронтенда"],
        "languages": ["Русский", "English"],
    },
    {
        "id": "mentor-02",
        "user_id": "user-masha01",
        "name": "Мария Сидорова",
        "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=mentor2",
        "title": "ML Engineer",
        "company": "Яндекс",
        "experience": "6 лет",
        "bio": "Строю ML-пайплайны в проде. Помогу с проектами по машинному обучению и подготовкой портфолио.",
        "tech_stack": ["Python", "TensorFlow", "PyTorch", "Pandas", "scikit-learn"],
        "rating": 4.8,
        "review_count": 93,
        "sessions_completed": 67,
        "price_per_hour": 100,
        "available": True,
        "specializations": ["Machine Learning", "Data Science", "Помощь с проектом"],
        "languages": ["Русский", "English"],
    },
    {
        "id": "mentor-03",
        "user_id": "user-dima01",
        "name": "Дмитрий Волков",
        "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=mentor3",
        "title": "DevOps Lead",
        "company": "VK",
        "experience": "10 лет",
        "bio": "Инфраструктура, CI/CD, Kubernetes в масштабе. Научу деплоить как в топ-компаниях.",
        "tech_stack": ["Docker", "Kubernetes", "Terraform", "GitHub Actions", "AWS"],
        "rating": 4.9,
        "review_count": 156,
        "sessions_completed": 134,
        "price_per_hour": 90,
        "available": True,
        "specializations": ["DevOps", "CI/CD", "Карьерная консультация"],
        "languages": ["Русский"],
    },
    {
        "id": "mentor-04",
        "user_id": "user-anna01",
        "name": "Анна Петрова",
        "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=mentor4",
        "title": "Senior Backend Engineer",
        "company": "Kaspersky",
        "experience": "7 лет",
        "bio": "Бэкенд на Go и Python. Микросервисы, высоконагруженные системы.",
        "tech_stack": ["Go", "Python", "PostgreSQL", "Redis", "gRPC"],
        "rating": 4.7,
        "review_count": 84,
        "sessions_completed": 52,
        "price_per_hour": 85,
        "available": False,
        "specializations": ["Backend", "System Design", "Микросервисы"],
        "languages": ["Русский", "English"],
    },
    {
        "id": "mentor-05",
        "user_id": "user-kirill01",
        "name": "Кирилл Новиков",
        "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=mentor5",
        "title": "iOS Lead",
        "company": "Avito",
        "experience": "9 лет",
        "bio": "Мобильная разработка на Swift и Kotlin. Архитектура и оптимизация iOS-приложений.",
        "tech_stack": ["Swift", "Kotlin", "SwiftUI", "Combine", "Core Data"],
        "rating": 4.8,
        "review_count": 71,
        "sessions_completed": 48,
        "price_per_hour": 75,
        "available": True,
        "specializations": ["iOS разработка", "Mobile архитектура", "Code Review"],
        "languages": ["Русский"],
    },
    {
        "id": "mentor-06",
        "user_id": "user-elena01",
        "name": "Елена Смирнова",
        "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=mentor6",
        "title": "Security Engineer",
        "company": "Positive Technologies",
        "experience": "5 лет",
        "bio": "Кибербезопасность: пентест, защита инфраструктуры, security-аудит.",
        "tech_stack": ["Python", "Bash", "Burp Suite", "Wireshark", "Metasploit"],
        "rating": 4.9,
        "review_count": 62,
        "sessions_completed": 41,
        "price_per_hour": 95,
        "available": True,
        "specializations": ["Кибербезопасность", "Пентест", "Security аудит"],
        "languages": ["Русский", "English"],
    },
]


async def seed():
    engine = create_async_engine(DATABASE_URL)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with async_session() as session:
        created = 0
        for m in MENTORS:
            result = await session.execute(select(MentorProfile).where(MentorProfile.id == m["id"]))
            if result.scalar_one_or_none():
                print(f"  skip  {m['name']}")
                continue
            session.add(MentorProfile(**m))
            print(f"  create {m['name']}")
            created += 1
        await session.commit()
        print(f"\nDone: {created} mentors created")
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(seed())
