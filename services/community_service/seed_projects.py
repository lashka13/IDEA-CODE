"""
Seed projects for community_service.
Run: docker cp services/community_service/seed_projects.py services-community_service-1:/app/seed_projects.py && docker exec services-community_service-1 python seed_projects.py
"""
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select
from src.projects.models import Project

DATABASE_URL = "postgresql+asyncpg://postgres:postgres@postgres:5432/community_db"

PROJECTS = [
    {
        "id": "proj-ecommerce",
        "title": "E-commerce магазин электроники",
        "description": "Полноценный интернет-магазин с каталогом, корзиной, оплатой и панелью администратора. Реальный проект для портфолио.",
        "difficulty": "intermediate",
        "status": "recruiting",
        "tech_stack": ["React", "Node.js", "PostgreSQL", "Redis", "Docker"],
        "mentor_id": "mentor-01",
        "tasks_count": 7,
        "deadline": "2026-05-15",
        "reward_coins": 500,
        "team_slots": [
            {"role": "frontend", "label": "Frontend", "filled": 1, "total": 2},
            {"role": "backend", "label": "Backend", "filled": 1, "total": 2},
            {"role": "devops", "label": "DevOps", "filled": 0, "total": 1},
            {"role": "design", "label": "Дизайн", "filled": 0, "total": 1},
        ],
        "members": [
            {"userId": "user-alex01", "role": "frontend", "isTeamLead": True},
            {"userId": "user-anna01", "role": "backend"},
        ],
        "max_members": 6,
    },
    {
        "id": "proj-learning",
        "title": "Платформа онлайн-обучения",
        "description": "LMS с курсами, видео-уроками, тестами, прогрессом студентов и сертификатами.",
        "difficulty": "advanced",
        "status": "in-progress",
        "tech_stack": ["Next.js", "Go", "PostgreSQL", "WebSocket", "S3"],
        "mentor_id": "mentor-04",
        "tasks_count": 12,
        "deadline": "2026-04-30",
        "reward_coins": 800,
        "team_slots": [
            {"role": "frontend", "label": "Frontend", "filled": 2, "total": 2},
            {"role": "backend", "label": "Backend", "filled": 2, "total": 2},
            {"role": "devops", "label": "DevOps", "filled": 1, "total": 1},
            {"role": "pm", "label": "PM", "filled": 1, "total": 1},
        ],
        "members": [
            {"userId": "user-alex01", "role": "frontend", "isTeamLead": True},
            {"userId": "user-masha01", "role": "frontend"},
            {"userId": "user-dima01", "role": "devops"},
            {"userId": "user-anna01", "role": "backend"},
        ],
        "max_members": 6,
    },
    {
        "id": "proj-fitness",
        "title": "Фитнес-трекер с ML",
        "description": "Мобильное приложение для трекинга тренировок с ML-рекомендациями и аналитикой прогресса.",
        "difficulty": "advanced",
        "status": "recruiting",
        "tech_stack": ["React Native", "Python", "FastAPI", "TensorFlow", "Firebase"],
        "mentor_id": "mentor-02",
        "tasks_count": 9,
        "deadline": "2026-06-01",
        "reward_coins": 600,
        "team_slots": [
            {"role": "mobile", "label": "Mobile", "filled": 1, "total": 2},
            {"role": "backend", "label": "Backend", "filled": 0, "total": 1},
            {"role": "ml", "label": "ML Engineer", "filled": 1, "total": 1},
            {"role": "design", "label": "Дизайн", "filled": 0, "total": 1},
        ],
        "members": [
            {"userId": "user-anna01", "role": "mobile", "isTeamLead": True},
            {"userId": "user-masha01", "role": "ml"},
        ],
        "max_members": 5,
    },
    {
        "id": "proj-chatbot",
        "title": "AI-чатбот поддержки",
        "description": "Умный чатбот для техподдержки на базе LLM с интеграцией в Telegram и веб.",
        "difficulty": "intermediate",
        "status": "review",
        "tech_stack": ["Python", "FastAPI", "React", "LangChain", "PostgreSQL"],
        "mentor_id": "mentor-02",
        "tasks_count": 6,
        "deadline": "2026-03-25",
        "reward_coins": 450,
        "team_slots": [
            {"role": "backend", "label": "Backend", "filled": 2, "total": 2},
            {"role": "frontend", "label": "Frontend", "filled": 1, "total": 1},
            {"role": "ml", "label": "ML Engineer", "filled": 1, "total": 1},
        ],
        "members": [
            {"userId": "user-dima01", "role": "backend", "isTeamLead": True},
            {"userId": "user-masha01", "role": "ml"},
            {"userId": "user-alex01", "role": "frontend"},
        ],
        "max_members": 4,
    },
    {
        "id": "proj-events",
        "title": "Агрегатор мероприятий кампуса",
        "description": "Веб-приложение для поиска и регистрации на мероприятия: хакатоны, митапы, лекции.",
        "difficulty": "beginner",
        "status": "recruiting",
        "tech_stack": ["Vue.js", "Node.js", "MongoDB", "Tailwind CSS"],
        "mentor_id": "mentor-01",
        "tasks_count": 5,
        "deadline": "2026-05-01",
        "reward_coins": 300,
        "team_slots": [
            {"role": "frontend", "label": "Frontend", "filled": 0, "total": 2},
            {"role": "backend", "label": "Backend", "filled": 1, "total": 1},
            {"role": "design", "label": "Дизайн", "filled": 0, "total": 1},
        ],
        "members": [
            {"userId": "user-anna01", "role": "backend"},
        ],
        "max_members": 4,
    },
]


async def seed():
    engine = create_async_engine(DATABASE_URL)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with async_session() as session:
        created = 0
        for p in PROJECTS:
            r = await session.execute(select(Project).where(Project.id == p["id"]))
            if r.scalar_one_or_none():
                print(f"  skip  {p['title'][:40]}")
                continue
            session.add(Project(**p))
            print(f"  create {p['title'][:40]}")
            created += 1
        await session.commit()
        print(f"\nDone: {created} projects created")
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(seed())
