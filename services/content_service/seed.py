"""
Seed script for content_service.
Run: docker cp services/content_service/seed.py services-content_service-1:/app/seed.py && docker exec services-content_service-1 python seed.py
"""
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select
from src.materials.models import Material
from src.lessons.models import Lesson
from src.comments.models import Comment  # noqa: F401 — needed for SQLAlchemy mapper
from src.purchases.models import Purchase  # noqa: F401 — needed for SQLAlchemy mapper

DATABASE_URL = "postgresql+asyncpg://postgres:postgres@postgres:5432/content_db"

MATERIALS = [
    {
        "id": "mat-react-01",
        "title": "React 19 + TypeScript: Полный курс",
        "description": "Изучите React 19 с нуля до продвинутого уровня. Хуки, контекст, Redux Toolkit, оптимизация производительности и современные паттерны разработки.",
        "author_id": "user-alex01",
        "cover_url": "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&q=80",
        "price": 150,
        "rating": 4.8,
        "rating_count": 124,
        "purchase_count": 89,
        "language": "ru",
        "technology": ["React", "TypeScript"],
        "difficulty": "intermediate",
        "format": "course",
        "task_type": "theory+practice",
        "tags": ["React", "TypeScript", "Frontend", "Hooks"],
        "table_of_contents": ["Введение в React 19", "Хуки и состояние", "TypeScript с React", "Redux Toolkit", "Оптимизация"],
        "lessons": [
            {"id": "les-r-01", "order": 1, "title": "Введение в React 19", "duration": "15 мин", "is_preview": True,
             "contents": [{"type": "text", "value": "React 19 — это последняя версия популярной библиотеки для построения UI. В этом уроке мы познакомимся с ключевыми изменениями."}]},
            {"id": "les-r-02", "order": 2, "title": "Хуки: useState и useEffect", "duration": "25 мин", "is_preview": True,
             "contents": [{"type": "text", "value": "Хуки позволяют использовать состояние и другие возможности React в функциональных компонентах."}]},
            {"id": "les-r-03", "order": 3, "title": "useCallback и useMemo", "duration": "20 мин", "is_preview": False,
             "contents": [{"type": "text", "value": "Оптимизация производительности с помощью мемоизации."}]},
            {"id": "les-r-04", "order": 4, "title": "TypeScript с React", "duration": "30 мин", "is_preview": False,
             "contents": [{"type": "text", "value": "Типизация props, state, хуков и событий."}]},
            {"id": "les-r-05", "order": 5, "title": "Redux Toolkit", "duration": "40 мин", "is_preview": False,
             "contents": [{"type": "text", "value": "Управление глобальным состоянием с Redux Toolkit и RTK Query."}]},
        ],
    },
    {
        "id": "mat-python-01",
        "title": "Python для Data Science",
        "description": "Pandas, NumPy, Matplotlib, Scikit-learn — полный стек data scientist'а. Реальные проекты и датасеты.",
        "author_id": "user-masha01",
        "cover_url": "https://images.unsplash.com/photo-1526379879527-8559ecfcaec0?w=800&q=80",
        "price": 120,
        "rating": 4.6,
        "rating_count": 87,
        "purchase_count": 63,
        "language": "ru",
        "technology": ["Python", "Pandas", "TensorFlow"],
        "difficulty": "beginner",
        "format": "course",
        "task_type": "theory+practice",
        "tags": ["Python", "Data Science", "ML", "Pandas"],
        "table_of_contents": ["Основы Python", "Pandas и NumPy", "Визуализация", "Машинное обучение", "Проект"],
        "lessons": [
            {"id": "les-p-01", "order": 1, "title": "Основы Python для DS", "duration": "20 мин", "is_preview": True,
             "contents": [{"type": "text", "value": "Быстрый старт в Python: типы данных, списки, словари, функции."}]},
            {"id": "les-p-02", "order": 2, "title": "Pandas: работа с данными", "duration": "35 мин", "is_preview": True,
             "contents": [{"type": "text", "value": "DataFrame, Series, фильтрация, группировка и агрегация."}]},
            {"id": "les-p-03", "order": 3, "title": "NumPy и векторизация", "duration": "25 мин", "is_preview": False,
             "contents": [{"type": "text", "value": "Массивы NumPy, математические операции и Broadcasting."}]},
            {"id": "les-p-04", "order": 4, "title": "Scikit-learn: первая модель", "duration": "40 мин", "is_preview": False,
             "contents": [{"type": "text", "value": "Обучение, валидация и оценка моделей машинного обучения."}]},
        ],
    },
    {
        "id": "mat-docker-01",
        "title": "Docker и Kubernetes: от нуля до прода",
        "description": "Контейнеризация приложений, Docker Compose, оркестрация с Kubernetes, CI/CD пайплайны и мониторинг.",
        "author_id": "user-dima01",
        "cover_url": "https://images.unsplash.com/photo-1605745341112-85968b19335a?w=800&q=80",
        "price": 200,
        "rating": 4.9,
        "rating_count": 201,
        "purchase_count": 156,
        "language": "ru",
        "technology": ["Docker", "Kubernetes", "CI/CD"],
        "difficulty": "advanced",
        "format": "course",
        "task_type": "theory+practice",
        "tags": ["Docker", "Kubernetes", "DevOps", "CI/CD"],
        "table_of_contents": ["Docker основы", "Docker Compose", "Kubernetes", "Helm Charts", "Мониторинг"],
        "lessons": [
            {"id": "les-d-01", "order": 1, "title": "Docker: контейнеры и образы", "duration": "25 мин", "is_preview": True,
             "contents": [{"type": "text", "value": "Что такое контейнеры, Dockerfile, слои образов и реестры."}]},
            {"id": "les-d-02", "order": 2, "title": "Docker Compose", "duration": "30 мин", "is_preview": True,
             "contents": [{"type": "text", "value": "Оркестрация нескольких сервисов, сети, тома и зависимости."}]},
            {"id": "les-d-03", "order": 3, "title": "Kubernetes: Pod и Deployment", "duration": "45 мин", "is_preview": False,
             "contents": [{"type": "text", "value": "Основные абстракции K8s, манифесты и управление через kubectl."}]},
            {"id": "les-d-04", "order": 4, "title": "Service и Ingress", "duration": "35 мин", "is_preview": False,
             "contents": [{"type": "text", "value": "Сетевое взаимодействие сервисов и проксирование трафика."}]},
            {"id": "les-d-05", "order": 5, "title": "CI/CD с GitHub Actions", "duration": "40 мин", "is_preview": False,
             "contents": [{"type": "text", "value": "Автоматическая сборка, тесты и деплой в Kubernetes."}]},
        ],
    },
    {
        "id": "mat-flutter-01",
        "title": "Flutter: кроссплатформенные приложения",
        "description": "Разработка мобильных и веб-приложений на Flutter и Dart. От первого виджета до публикации в App Store и Google Play.",
        "author_id": "user-anna01",
        "cover_url": "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&q=80",
        "price": 100,
        "rating": 4.3,
        "rating_count": 45,
        "purchase_count": 28,
        "language": "ru",
        "technology": ["Flutter", "Dart", "Kotlin"],
        "difficulty": "beginner",
        "format": "course",
        "task_type": "theory+practice",
        "tags": ["Flutter", "Dart", "Mobile", "iOS", "Android"],
        "table_of_contents": ["Dart основы", "Виджеты Flutter", "Навигация", "State management", "Публикация"],
        "lessons": [
            {"id": "les-f-01", "order": 1, "title": "Dart за 30 минут", "duration": "30 мин", "is_preview": True,
             "contents": [{"type": "text", "value": "Синтаксис Dart, типы, функции, классы и асинхронность."}]},
            {"id": "les-f-02", "order": 2, "title": "Первый Flutter проект", "duration": "20 мин", "is_preview": True,
             "contents": [{"type": "text", "value": "Установка Flutter SDK, создание проекта и Hot Reload."}]},
            {"id": "les-f-03", "order": 3, "title": "Виджеты и layout", "duration": "35 мин", "is_preview": False,
             "contents": [{"type": "text", "value": "Column, Row, Stack, Container и адаптивная верстка."}]},
        ],
    },
    {
        "id": "mat-go-01",
        "title": "Go: системное программирование",
        "description": "Горутины, каналы, интерфейсы, сетевые сервисы на Go. Практика на реальных задачах.",
        "author_id": "user-alex01",
        "cover_url": "https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=800&q=80",
        "price": 180,
        "rating": 4.7,
        "rating_count": 93,
        "purchase_count": 71,
        "language": "ru",
        "technology": ["Go"],
        "difficulty": "intermediate",
        "format": "course",
        "task_type": "theory+practice",
        "tags": ["Go", "Backend", "Concurrency", "Systems"],
        "table_of_contents": ["Основы Go", "Горутины", "Каналы", "Интерфейсы", "HTTP сервер"],
        "lessons": [
            {"id": "les-g-01", "order": 1, "title": "Основы Go", "duration": "20 мин", "is_preview": True,
             "contents": [{"type": "text", "value": "Переменные, типы, функции, структуры и пакеты."}]},
            {"id": "les-g-02", "order": 2, "title": "Горутины и каналы", "duration": "30 мин", "is_preview": True,
             "contents": [{"type": "text", "value": "Конкурентность в Go: goroutines, channels и sync."}]},
            {"id": "les-g-03", "order": 3, "title": "HTTP сервер на Go", "duration": "40 мин", "is_preview": False,
             "contents": [{"type": "text", "value": "Создание REST API с net/http и chi router."}]},
        ],
    },
]


async def seed():
    engine = create_async_engine(DATABASE_URL)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        mat_created = 0
        les_created = 0

        for data in MATERIALS:
            result = await session.execute(select(Material).where(Material.id == data["id"]))
            if result.scalar_one_or_none():
                print(f"  skip  material: {data['title'][:40]}")
                continue

            lessons_data = data.pop("lessons")
            material = Material(**data)
            session.add(material)
            mat_created += 1
            print(f"  create material: {data['title'][:40]}")

            for l in lessons_data:
                result = await session.execute(select(Lesson).where(Lesson.id == l["id"]))
                if result.scalar_one_or_none():
                    continue
                lesson = Lesson(material_id=data["id"], **l)
                session.add(lesson)
                les_created += 1

        await session.commit()
        print(f"\nDone: {mat_created} materials, {les_created} lessons created")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed())
