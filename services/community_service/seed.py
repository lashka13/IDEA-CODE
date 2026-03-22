"""
Seed script for community_service.
Run: docker cp services/community_service/seed.py services-community_service-1:/app/seed.py && docker exec services-community_service-1 python seed.py
"""
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select
from src.communities.models import Community, CommunityMember

DATABASE_URL = "postgresql+asyncpg://postgres:postgres@postgres:5432/community_db"

COMMUNITIES = [
    {
        "id": "com-react",
        "name": "React & Frontend",
        "slug": "react-frontend",
        "description": "Сообщество фронтенд-разработчиков. Обсуждаем React, Vue, Angular, CSS и всё что связано с UI.",
        "cover_url": "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&q=80",
        "icon_emoji": "⚛️",
        "member_count": 3,
        "material_count": 2,
        "activity_score": 9.2,
        "color": "#61DAFB",
        "tags": ["React", "TypeScript", "CSS", "Frontend"],
        "members": [
            {"user_id": "user-alex01", "role": "admin"},
            {"user_id": "user-masha01", "role": "member"},
            {"user_id": "user-anna01", "role": "member"},
            {"user_id": "user-demo01", "role": "member"},
        ],
    },
    {
        "id": "com-devops",
        "name": "DevOps & Cloud",
        "slug": "devops-cloud",
        "description": "Docker, Kubernetes, CI/CD, облачные платформы. Делимся опытом и помогаем друг другу.",
        "cover_url": "https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?w=800&q=80",
        "icon_emoji": "🐳",
        "member_count": 2,
        "material_count": 1,
        "activity_score": 7.8,
        "color": "#2496ED",
        "tags": ["Docker", "Kubernetes", "AWS", "DevOps"],
        "members": [
            {"user_id": "user-dima01", "role": "admin"},
            {"user_id": "user-alex01", "role": "member"},
        ],
    },
    {
        "id": "com-ds",
        "name": "Data Science & ML",
        "slug": "data-science",
        "description": "Python, Pandas, TensorFlow, PyTorch — всё о машинном обучении и анализе данных.",
        "cover_url": "https://images.unsplash.com/photo-1526379879527-8559ecfcaec0?w=800&q=80",
        "icon_emoji": "📊",
        "member_count": 2,
        "material_count": 1,
        "activity_score": 8.1,
        "color": "#FF6B6B",
        "tags": ["Python", "ML", "Data Science", "AI"],
        "members": [
            {"user_id": "user-masha01", "role": "admin"},
            {"user_id": "user-dima01", "role": "member"},
        ],
    },
    {
        "id": "com-mobile",
        "name": "Mobile Dev",
        "slug": "mobile-dev",
        "description": "iOS, Android, Flutter, React Native — разработка мобильных приложений.",
        "cover_url": "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&q=80",
        "icon_emoji": "📱",
        "member_count": 2,
        "material_count": 1,
        "activity_score": 6.5,
        "color": "#A8FF78",
        "tags": ["Flutter", "Swift", "Kotlin", "Mobile"],
        "members": [
            {"user_id": "user-anna01", "role": "admin"},
            {"user_id": "user-masha01", "role": "member"},
        ],
    },
]


async def seed():
    engine = create_async_engine(DATABASE_URL)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        com_created = 0
        mem_created = 0

        for data in COMMUNITIES:
            result = await session.execute(select(Community).where(Community.id == data["id"]))
            if result.scalar_one_or_none():
                print(f"  skip  community: {data['name']}")
                continue

            members_data = data.pop("members")
            community = Community(**data)
            session.add(community)
            com_created += 1
            print(f"  create community: {data['name']}")

            for m in members_data:
                member = CommunityMember(community_id=data["id"], **m)
                session.add(member)
                mem_created += 1

        await session.commit()
        print(f"\nDone: {com_created} communities, {mem_created} members created")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed())
