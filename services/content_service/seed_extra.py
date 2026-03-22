"""
Seed tasks, challenges, schedule events, and roadmap tracks.
Run: docker cp services/content_service/seed_extra.py services-content_service-1:/app/seed_extra.py && docker exec services-content_service-1 python seed_extra.py
"""
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select
from src.tasks.models import Task
from src.challenges.models import Challenge
from src.schedule.models import ScheduleEvent
from src.roadmap.models import RoadmapTrack, RoadmapNode

DATABASE_URL = "postgresql+asyncpg://postgres:postgres@postgres:5432/content_db"

TASKS = [
    {
        "id": "task-twosum",
        "title": "Two Sum",
        "description": "Дан массив целых чисел nums и целое число target. Верните индексы двух элементов, сумма которых равна target.",
        "difficulty": "easy",
        "category": "algorithms",
        "topic": "Массивы",
        "is_theory": False,
        "input_format": "Первая строка — массив чисел. Вторая строка — целевая сумма.",
        "output_format": "Два индекса через пробел.",
        "constraints": ["2 <= nums.length <= 10^4", "-10^9 <= nums[i] <= 10^9"],
        "examples": [{"input": "[2,7,11,15]\n9", "output": "0 1", "explanation": "nums[0] + nums[1] = 2 + 7 = 9"}],
        "hidden_tests": [{"input": "[3,2,4]\n6", "output": "1 2"}],
        "time_limit_ms": 1000,
        "memory_limit_mb": 256,
        "solved_count": 15234,
        "acceptance_rate": 78.5,
        "tags": ["Array", "Hash Table"],
        "hints": ["Используйте хеш-таблицу для O(n)"],
    },
    {
        "id": "task-reverse-ll",
        "title": "Reverse Linked List",
        "description": "Разверните односвязный список.",
        "difficulty": "easy",
        "category": "algorithms",
        "topic": "Связные списки",
        "is_theory": False,
        "input_format": "Список чисел — элементы связного списка.",
        "output_format": "Развёрнутый список.",
        "constraints": ["0 <= n <= 5000"],
        "examples": [{"input": "[1,2,3,4,5]", "output": "[5,4,3,2,1]"}],
        "hidden_tests": [{"input": "[1,2]", "output": "[2,1]"}],
        "time_limit_ms": 1000,
        "memory_limit_mb": 256,
        "solved_count": 12891,
        "acceptance_rate": 82.1,
        "tags": ["Linked List", "Recursion"],
        "hints": ["Итеративно: три указателя prev, curr, next"],
    },
    {
        "id": "task-max-substr",
        "title": "Longest Substring Without Repeating Characters",
        "description": "Найдите длину самой длинной подстроки без повторяющихся символов.",
        "difficulty": "medium",
        "category": "algorithms",
        "topic": "Скользящее окно",
        "is_theory": False,
        "input_format": "Строка s.",
        "output_format": "Целое число — длина подстроки.",
        "constraints": ["0 <= s.length <= 5 * 10^4"],
        "examples": [{"input": "abcabcbb", "output": "3", "explanation": "abc — длина 3"}],
        "hidden_tests": [{"input": "bbbbb", "output": "1"}],
        "time_limit_ms": 1000,
        "memory_limit_mb": 256,
        "solved_count": 9876,
        "acceptance_rate": 55.3,
        "tags": ["Hash Table", "Sliding Window", "String"],
        "hints": ["Sliding window с множеством символов"],
    },
    {
        "id": "task-matrix-det",
        "title": "Определитель матрицы",
        "description": "Вычислите определитель квадратной матрицы NxN.",
        "difficulty": "hard",
        "category": "math",
        "topic": "Линейная алгебра",
        "is_theory": False,
        "input_format": "N — размер, затем N строк по N чисел.",
        "output_format": "Определитель матрицы.",
        "constraints": ["1 <= N <= 10"],
        "examples": [{"input": "2\n1 2\n3 4", "output": "-2"}],
        "hidden_tests": [{"input": "3\n1 0 0\n0 1 0\n0 0 1", "output": "1"}],
        "time_limit_ms": 2000,
        "memory_limit_mb": 256,
        "solved_count": 2341,
        "acceptance_rate": 42.7,
        "tags": ["Math", "Matrix", "Recursion"],
        "hints": ["Разложение по первой строке или метод Гаусса"],
    },
    {
        "id": "task-docker-theory",
        "title": "Docker: основные концепции",
        "description": "Проверьте свои знания о контейнеризации и Docker.",
        "difficulty": "easy",
        "category": "theory",
        "topic": "DevOps",
        "is_theory": True,
        "options": [
            {"id": "a", "text": "Docker image — это запущенный экземпляр контейнера"},
            {"id": "b", "text": "Docker image — это шаблон для создания контейнеров"},
            {"id": "c", "text": "Docker image — это виртуальная машина"},
            {"id": "d", "text": "Docker image — это конфигурационный файл"},
        ],
        "correct_option_id": "b",
        "explanation": "Docker image — это неизменяемый шаблон (blueprint), из которого создаются контейнеры. Контейнер — это запущенный экземпляр образа.",
        "solved_count": 8921,
        "acceptance_rate": 91.2,
        "tags": ["Docker", "DevOps", "Theory"],
    },
    {
        "id": "task-islands",
        "title": "Number of Islands",
        "description": "Дана 2D сетка из '1' (суша) и '0' (вода). Посчитайте количество островов.",
        "difficulty": "medium",
        "category": "algorithms",
        "topic": "Графы",
        "is_theory": False,
        "input_format": "2D массив из символов '0' и '1'.",
        "output_format": "Количество островов.",
        "constraints": ["1 <= m, n <= 300"],
        "examples": [{"input": '["11110","11010","11000","00000"]', "output": "1"}],
        "hidden_tests": [{"input": '["11000","11000","00100","00011"]', "output": "3"}],
        "time_limit_ms": 1000,
        "memory_limit_mb": 256,
        "solved_count": 7654,
        "acceptance_rate": 61.8,
        "tags": ["BFS", "DFS", "Graph", "Matrix"],
        "hints": ["DFS/BFS от каждой непосещённой клетки суши"],
    },
    {
        "id": "task-sysdesign-url",
        "title": "System Design: URL Shortener",
        "description": "Спроектируйте сервис сокращения URL (типа bit.ly). Опишите архитектуру, хранилище, API и масштабирование.",
        "difficulty": "hard",
        "category": "system-design",
        "topic": "Распределённые системы",
        "is_theory": True,
        "options": [
            {"id": "a", "text": "Использовать автоинкремент ID и кодировать в base62"},
            {"id": "b", "text": "Генерировать случайную строку и проверять коллизии"},
            {"id": "c", "text": "Использовать хеш URL и обрезать до N символов"},
            {"id": "d", "text": "Все варианты рабочие, выбор зависит от требований"},
        ],
        "correct_option_id": "d",
        "explanation": "Все три подхода применяются в реальных системах. Auto-increment + base62 даёт минимальные URL, random — простоту, hash — детерминизм.",
        "solved_count": 3421,
        "acceptance_rate": 67.3,
        "tags": ["System Design", "Distributed Systems"],
    },
]

CHALLENGES = [
    {
        "id": "ch-algo-week",
        "title": "Алгоритмическая неделя",
        "description": "5 задач возрастающей сложности. Решите все за неделю и получите приз!",
        "type": "weekly",
        "difficulty": "middle",
        "category": "Алгоритмы",
        "prize_pool": 500,
        "participants_count": 47,
        "max_participants": 0,
        "starts_at": "2026-03-17T00:00:00",
        "ends_at": "2026-03-24T23:59:59",
        "status": "active",
        "task_ids": ["task-twosum", "task-reverse-ll", "task-max-substr"],
        "top_participants": [
            {"userId": "user-alex01", "score": 280},
            {"userId": "user-masha01", "score": 245},
        ],
    },
    {
        "id": "ch-docker",
        "title": "Docker Challenge",
        "description": "Контейнеризация от простого к сложному. Multi-stage builds, networking, compose.",
        "type": "special",
        "difficulty": "senior",
        "category": "DevOps",
        "prize_pool": 800,
        "participants_count": 23,
        "max_participants": 50,
        "starts_at": "2026-03-15T00:00:00",
        "ends_at": "2026-03-29T23:59:59",
        "status": "active",
        "task_ids": ["task-docker-theory"],
        "top_participants": [
            {"userId": "user-dima01", "score": 450},
        ],
    },
    {
        "id": "ch-react-master",
        "title": "React Master",
        "description": "Станьте мастером React. Хуки, паттерны, оптимизация, SSR.",
        "type": "weekly",
        "difficulty": "middle",
        "category": "Frontend",
        "prize_pool": 600,
        "participants_count": 62,
        "max_participants": 0,
        "starts_at": "2026-03-25T00:00:00",
        "ends_at": "2026-04-01T23:59:59",
        "status": "upcoming",
        "task_ids": [],
        "top_participants": [],
    },
    {
        "id": "ch-sql-marathon",
        "title": "SQL Марафон",
        "description": "30 SQL-задач за 30 дней. От простых SELECT до сложных оконных функций.",
        "type": "special",
        "difficulty": "junior",
        "category": "Базы данных",
        "prize_pool": 300,
        "participants_count": 89,
        "max_participants": 0,
        "starts_at": "2026-02-01T00:00:00",
        "ends_at": "2026-03-01T23:59:59",
        "status": "ended",
        "task_ids": [],
        "top_participants": [
            {"userId": "user-anna01", "score": 890},
            {"userId": "user-masha01", "score": 870},
        ],
    },
]

EVENTS = [
    {
        "id": "evt-react-hooks",
        "title": "React Hooks Deep Dive",
        "description": "Разбираем useCallback, useMemo, useRef и кастомные хуки на реальных примерах.",
        "type": "stream",
        "host_name": "Алексей Козлов",
        "host_avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=mentor1",
        "cover_url": "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&q=80",
        "starts_at": "2026-03-22T18:00:00",
        "duration_minutes": 90,
        "is_live": True,
        "participants_count": 34,
        "max_participants": 0,
        "recording_available": False,
        "tags": ["React", "Hooks", "TypeScript"],
    },
    {
        "id": "evt-docker-multi",
        "title": "Docker Multi-stage Builds",
        "description": "Оптимизация Docker-образов: multi-stage builds, кеширование слоёв, best practices.",
        "type": "webinar",
        "host_name": "Дмитрий Волков",
        "host_avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=mentor3",
        "cover_url": "https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?w=800&q=80",
        "starts_at": "2026-03-23T15:00:00",
        "duration_minutes": 60,
        "is_live": False,
        "participants_count": 18,
        "max_participants": 100,
        "recording_available": False,
        "tags": ["Docker", "DevOps", "Optimization"],
    },
    {
        "id": "evt-ml-workshop",
        "title": "ML Pipeline Workshop",
        "description": "Строим production ML pipeline: данные → обучение → деплой → мониторинг.",
        "type": "workshop",
        "host_name": "Мария Сидорова",
        "host_avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=mentor2",
        "cover_url": "https://images.unsplash.com/photo-1526379879527-8559ecfcaec0?w=800&q=80",
        "starts_at": "2026-03-24T16:00:00",
        "duration_minutes": 120,
        "is_live": False,
        "participants_count": 42,
        "max_participants": 50,
        "recording_available": False,
        "tags": ["ML", "Python", "MLOps"],
    },
    {
        "id": "evt-frontend-qa",
        "title": "Q&A: Карьера во фронтенде",
        "description": "Открытая сессия вопросов-ответов о карьере фронтенд-разработчика.",
        "type": "q-and-a",
        "host_name": "Алексей Козлов",
        "host_avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=mentor1",
        "cover_url": "",
        "starts_at": "2026-03-25T19:00:00",
        "duration_minutes": 60,
        "is_live": False,
        "participants_count": 67,
        "max_participants": 0,
        "recording_available": False,
        "tags": ["Career", "Frontend"],
    },
    {
        "id": "evt-algo-prep",
        "title": "Подготовка к алгоритмическим интервью",
        "description": "Разбираем top-50 задач LeetCode для FAANG-собеседований.",
        "type": "stream",
        "host_name": "Анна Петрова",
        "host_avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=mentor4",
        "cover_url": "",
        "starts_at": "2026-03-20T18:00:00",
        "duration_minutes": 120,
        "is_live": False,
        "participants_count": 89,
        "max_participants": 0,
        "recording_available": True,
        "tags": ["Algorithms", "Interview Prep", "LeetCode"],
    },
]

TRACKS = [
    {
        "id": "track-frontend",
        "title": "Frontend Developer",
        "description": "Путь от HTML до архитектуры фронтенда",
        "emoji": "🎨",
        "color": "#39FF14",
        "nodes": [
            {"id": "rn-html", "title": "HTML & CSS", "description": "Основы вёрстки и стилизации", "category": "basics", "difficulty": "beginner", "skills": ["HTML5", "CSS3", "Flexbox", "Grid"], "material_ids": [], "dependencies": [], "estimated_hours": 40, "status": "completed", "progress": 100, "order": 1},
            {"id": "rn-js", "title": "JavaScript", "description": "Основы языка, DOM, Events, Async", "category": "language", "difficulty": "beginner", "skills": ["ES6+", "DOM API", "Fetch", "Promises"], "material_ids": [], "dependencies": ["rn-html"], "estimated_hours": 60, "status": "completed", "progress": 100, "order": 2},
            {"id": "rn-ts", "title": "TypeScript", "description": "Типизация, generics, utility types", "category": "language", "difficulty": "intermediate", "skills": ["TypeScript", "Generics", "Utility Types"], "material_ids": [], "dependencies": ["rn-js"], "estimated_hours": 30, "status": "completed", "progress": 100, "order": 3},
            {"id": "rn-react", "title": "React", "description": "Компоненты, хуки, роутинг", "category": "framework", "difficulty": "intermediate", "skills": ["React", "Hooks", "React Router"], "material_ids": ["mat-react-01"], "dependencies": ["rn-ts"], "estimated_hours": 50, "status": "in-progress", "progress": 65, "order": 4},
            {"id": "rn-state", "title": "State Management", "description": "Redux, Zustand, Context API", "category": "framework", "difficulty": "intermediate", "skills": ["Redux Toolkit", "Zustand", "RTK Query"], "material_ids": [], "dependencies": ["rn-react"], "estimated_hours": 25, "status": "available", "progress": 0, "order": 5},
            {"id": "rn-testing", "title": "Testing", "description": "Jest, React Testing Library, Cypress", "category": "tools", "difficulty": "intermediate", "skills": ["Jest", "RTL", "Cypress"], "material_ids": [], "dependencies": ["rn-react"], "estimated_hours": 20, "status": "locked", "progress": 0, "order": 6},
            {"id": "rn-ssr", "title": "SSR & Next.js", "description": "Server Side Rendering, ISR, App Router", "category": "framework", "difficulty": "advanced", "skills": ["Next.js", "SSR", "ISR"], "material_ids": [], "dependencies": ["rn-state"], "estimated_hours": 35, "status": "locked", "progress": 0, "order": 7},
        ],
    },
    {
        "id": "track-backend",
        "title": "Backend Developer",
        "description": "Путь от Python/Go до микросервисов",
        "emoji": "⚙️",
        "color": "#00F0FF",
        "nodes": [
            {"id": "rn-python", "title": "Python / Go", "description": "Основы серверного языка", "category": "language", "difficulty": "beginner", "skills": ["Python", "Go", "Async"], "material_ids": ["mat-go-01"], "dependencies": [], "estimated_hours": 50, "status": "completed", "progress": 100, "order": 1},
            {"id": "rn-sql", "title": "SQL & Databases", "description": "PostgreSQL, индексы, транзакции", "category": "database", "difficulty": "beginner", "skills": ["SQL", "PostgreSQL", "SQLAlchemy"], "material_ids": [], "dependencies": ["rn-python"], "estimated_hours": 40, "status": "completed", "progress": 100, "order": 2},
            {"id": "rn-rest", "title": "REST API", "description": "FastAPI, Express, валидация", "category": "framework", "difficulty": "intermediate", "skills": ["FastAPI", "REST", "OpenAPI"], "material_ids": [], "dependencies": ["rn-sql"], "estimated_hours": 35, "status": "in-progress", "progress": 40, "order": 3},
            {"id": "rn-docker", "title": "Docker & CI/CD", "description": "Контейнеризация, пайплайны", "category": "devops", "difficulty": "intermediate", "skills": ["Docker", "Docker Compose", "GitHub Actions"], "material_ids": ["mat-docker-01"], "dependencies": ["rn-rest"], "estimated_hours": 30, "status": "available", "progress": 0, "order": 4},
            {"id": "rn-micro", "title": "Микросервисы", "description": "Kafka, gRPC, distributed systems", "category": "architecture", "difficulty": "advanced", "skills": ["Kafka", "gRPC", "K8s"], "material_ids": [], "dependencies": ["rn-docker"], "estimated_hours": 50, "status": "locked", "progress": 0, "order": 5},
        ],
    },
    {
        "id": "track-ds",
        "title": "Data Science / ML",
        "description": "Путь от анализа данных до нейросетей",
        "emoji": "🧠",
        "color": "#A855F7",
        "nodes": [
            {"id": "rn-pyanalysis", "title": "Python для анализа", "description": "Pandas, NumPy, Matplotlib", "category": "analysis", "difficulty": "beginner", "skills": ["Pandas", "NumPy", "Matplotlib"], "material_ids": ["mat-python-01"], "dependencies": [], "estimated_hours": 40, "status": "completed", "progress": 100, "order": 1},
            {"id": "rn-ml", "title": "Machine Learning", "description": "scikit-learn, классификация, регрессия", "category": "ml", "difficulty": "intermediate", "skills": ["scikit-learn", "Feature Engineering"], "material_ids": [], "dependencies": ["rn-pyanalysis"], "estimated_hours": 50, "status": "in-progress", "progress": 30, "order": 2},
            {"id": "rn-dl", "title": "Deep Learning", "description": "TensorFlow, PyTorch, нейросети", "category": "dl", "difficulty": "advanced", "skills": ["TensorFlow", "PyTorch", "CNN", "RNN"], "material_ids": [], "dependencies": ["rn-ml"], "estimated_hours": 60, "status": "locked", "progress": 0, "order": 3},
        ],
    },
]


async def seed():
    engine = create_async_engine(DATABASE_URL)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with async_session() as session:
        # Tasks
        tc = 0
        for t in TASKS:
            r = await session.execute(select(Task).where(Task.id == t["id"]))
            if r.scalar_one_or_none():
                continue
            session.add(Task(**t))
            tc += 1
        print(f"  Tasks: {tc} created")

        # Challenges
        cc = 0
        for c in CHALLENGES:
            r = await session.execute(select(Challenge).where(Challenge.id == c["id"]))
            if r.scalar_one_or_none():
                continue
            session.add(Challenge(**c))
            cc += 1
        print(f"  Challenges: {cc} created")

        # Events
        ec = 0
        for e in EVENTS:
            r = await session.execute(select(ScheduleEvent).where(ScheduleEvent.id == e["id"]))
            if r.scalar_one_or_none():
                continue
            session.add(ScheduleEvent(**e))
            ec += 1
        print(f"  Events: {ec} created")

        # Roadmap
        trc = 0
        nc = 0
        for track_data in TRACKS:
            nodes_data = track_data.pop("nodes")
            r = await session.execute(select(RoadmapTrack).where(RoadmapTrack.id == track_data["id"]))
            if r.scalar_one_or_none():
                continue
            session.add(RoadmapTrack(**track_data))
            trc += 1
            for n in nodes_data:
                n["track_id"] = track_data["id"]
                session.add(RoadmapNode(**n))
                nc += 1
        print(f"  Roadmap: {trc} tracks, {nc} nodes created")

        await session.commit()
        print("\nDone!")
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(seed())
