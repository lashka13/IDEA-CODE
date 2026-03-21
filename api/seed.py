"""Seed the database with initial data matching frontend mocks."""
import asyncio
from datetime import datetime
from database import engine, async_session, Base
from models import (
    User, Material, Community, CommunityMember, Transaction,
    Achievement, UserAchievement, Comment, Post, Purchase,
    ChatChannel, Notification,
)
from services.auth import hash_password

DEFAULT_PASSWORD = "password123"


async def seed():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    async with async_session() as db:
        # ===== ACHIEVEMENTS =====
        achievements = [
            Achievement(id="ach-1", name="Первый шаг", description="Зарегистрируйся на платформе", icon="🎯", rarity="common"),
            Achievement(id="ach-2", name="Автор", description="Загрузи свой первый материал", icon="✍️", rarity="common"),
            Achievement(id="ach-3", name="Популярный автор", description="10+ покупок твоего материала", icon="🔥", rarity="rare"),
            Achievement(id="ach-4", name="Мега-эксперт", description="Загрузи 10+ материалов", icon="🏆", rarity="epic"),
            Achievement(id="ach-5", name="Ценный кадр", description="Рейтинг 4.8+ при 20+ оценках", icon="💎", rarity="epic"),
            Achievement(id="ach-6", name="Сообщество", description="Вступи в 3 сообщества", icon="🤝", rarity="common"),
            Achievement(id="ach-7", name="Автор месяца", description="Стань топ-1 автором недели", icon="👑", rarity="legendary"),
            Achievement(id="ach-8", name="Легенда", description="1000+ CodeCoins заработано", icon="🌟", rarity="legendary"),
            Achievement(id="ach-9", name="Челленджер", description="Выиграй челлендж сообщества", icon="⚡", rarity="rare"),
            Achievement(id="ach-10", name="Книжный червь", description="Купи 50+ материалов", icon="📚", rarity="epic"),
        ]
        db.add_all(achievements)

        # ===== USERS =====
        users_data = [
            {"id": "user-1", "name": "Алексей Петров", "username": "alexdev", "email": "alex@example.com",
             "avatar_url": "https://api.dicebear.com/9.x/notionists/svg?seed=Alex&backgroundColor=39FF14",
             "bio": "Fullstack-разработчик, 3 курс МИСИС. Люблю React и Go.", "rating": 4.8,
             "code_coins": 1250, "level": 12, "level_title": "Эксперт",
             "tech_stack": ["React", "TypeScript", "Go", "PostgreSQL"],
             "skills": {"Frontend": 90, "Backend": 75, "DevOps": 40, "Data Science": 20, "Mobile": 15, "Security": 10},
             "achievement_ids": ["ach-1", "ach-2", "ach-3", "ach-5", "ach-7"],
             "joined_at": "2025-09-01", "uploads_count": 24, "purchases_count": 38},
            {"id": "user-2", "name": "Мария Козлова", "username": "mashka_ds", "email": "maria@example.com",
             "avatar_url": "https://api.dicebear.com/9.x/notionists/svg?seed=Maria&backgroundColor=00F0FF",
             "bio": "Data Science энтузиаст, ML инженер. Pandas — моя вторая натура.", "rating": 4.6,
             "code_coins": 890, "level": 9, "level_title": "Продвинутый",
             "tech_stack": ["Python", "Pandas", "TensorFlow", "PostgreSQL"],
             "skills": {"Frontend": 15, "Backend": 45, "DevOps": 20, "Data Science": 95, "Mobile": 5, "Security": 10},
             "achievement_ids": ["ach-1", "ach-4", "ach-6"],
             "joined_at": "2025-10-15", "uploads_count": 15, "purchases_count": 22},
            {"id": "user-3", "name": "Дмитрий Волков", "username": "dima_devops", "email": "dima@example.com",
             "avatar_url": "https://api.dicebear.com/9.x/notionists/svg?seed=Dima&backgroundColor=2496ED",
             "bio": "DevOps инженер, Docker-маньяк. Автоматизирую всё.", "rating": 4.9,
             "code_coins": 2100, "level": 15, "level_title": "Гуру",
             "tech_stack": ["Docker", "Kubernetes", "CI/CD", "Linux", "Go"],
             "skills": {"Frontend": 20, "Backend": 60, "DevOps": 95, "Data Science": 10, "Mobile": 5, "Security": 55},
             "achievement_ids": ["ach-1", "ach-2", "ach-3", "ach-4", "ach-5", "ach-7", "ach-8"],
             "joined_at": "2025-08-20", "uploads_count": 42, "purchases_count": 18},
            {"id": "user-4", "name": "Анна Сидорова", "username": "anna_mobile", "email": "anna@example.com",
             "avatar_url": "https://api.dicebear.com/9.x/notionists/svg?seed=Anna&backgroundColor=A855F7",
             "bio": "Мобильная разработка — моя страсть. Kotlin + Flutter.", "rating": 4.3,
             "code_coins": 450, "level": 5, "level_title": "Новичок",
             "tech_stack": ["Kotlin", "Flutter", "Dart", "Firebase"],
             "skills": {"Frontend": 40, "Backend": 30, "DevOps": 10, "Data Science": 5, "Mobile": 85, "Security": 5},
             "achievement_ids": ["ach-1"],
             "joined_at": "2026-01-10", "uploads_count": 6, "purchases_count": 45},
            {"id": "user-5", "name": "Игорь Новиков", "username": "igor_sec", "email": "igor@example.com",
             "avatar_url": "https://api.dicebear.com/9.x/notionists/svg?seed=Igor&backgroundColor=FF1744",
             "bio": "CTF-игрок и пентестер. Безопасность прежде всего.", "rating": 4.7,
             "code_coins": 1600, "level": 11, "level_title": "Эксперт",
             "tech_stack": ["Python", "Linux", "Wireshark", "Burp Suite"],
             "skills": {"Frontend": 10, "Backend": 40, "DevOps": 35, "Data Science": 15, "Mobile": 5, "Security": 92},
             "achievement_ids": ["ach-1", "ach-2", "ach-5"],
             "joined_at": "2025-09-15", "uploads_count": 19, "purchases_count": 27},
            {"id": "user-6", "name": "Елена Тихонова", "username": "lena_front", "email": "lena@example.com",
             "avatar_url": "https://api.dicebear.com/9.x/notionists/svg?seed=Lena&backgroundColor=FF6F00",
             "bio": "UI/UX + Frontend. Делаю веб красивым.", "rating": 4.5,
             "code_coins": 780, "level": 8, "level_title": "Продвинутый",
             "tech_stack": ["React", "Vue", "CSS", "Figma"],
             "skills": {"Frontend": 92, "Backend": 25, "DevOps": 10, "Data Science": 5, "Mobile": 30, "Security": 5},
             "achievement_ids": ["ach-1", "ach-3", "ach-6"],
             "joined_at": "2025-11-01", "uploads_count": 11, "purchases_count": 33},
            {"id": "user-7", "name": "Артём Кузнецов", "username": "artem_java", "email": "artem@example.com",
             "avatar_url": "https://api.dicebear.com/9.x/notionists/svg?seed=Artem&backgroundColor=ED8B00",
             "bio": "Java backend разработчик. Spring Boot forever.", "rating": 4.4,
             "code_coins": 920, "level": 10, "level_title": "Эксперт",
             "tech_stack": ["Java", "Spring Boot", "PostgreSQL", "RabbitMQ"],
             "skills": {"Frontend": 15, "Backend": 90, "DevOps": 30, "Data Science": 10, "Mobile": 20, "Security": 20},
             "achievement_ids": ["ach-1", "ach-2", "ach-4"],
             "joined_at": "2025-10-01", "uploads_count": 18, "purchases_count": 25},
            {"id": "user-8", "name": "Николай Смирнов", "username": "nik_gamedev", "email": "nik@example.com",
             "avatar_url": "https://api.dicebear.com/9.x/notionists/svg?seed=Nik&backgroundColor=4CAF50",
             "bio": "Создаю игры на Unity. C# мой основной язык.", "rating": 4.2,
             "code_coins": 340, "level": 4, "level_title": "Новичок",
             "tech_stack": ["Unity", "C#", "Blender", "Godot"],
             "skills": {"Frontend": 30, "Backend": 20, "DevOps": 5, "Data Science": 5, "Mobile": 15, "Security": 5},
             "achievement_ids": ["ach-1"],
             "joined_at": "2026-02-01", "uploads_count": 4, "purchases_count": 12},
        ]

        for u_data in users_data:
            ach_ids = u_data.pop("achievement_ids")
            joined_at = u_data.pop("joined_at")
            user = User(
                **u_data,
                hashed_password=hash_password(DEFAULT_PASSWORD),
                joined_at=datetime.fromisoformat(joined_at),
            )
            db.add(user)
            await db.flush()
            for ach_id in ach_ids:
                db.add(UserAchievement(user_id=user.id, achievement_id=ach_id))

        # ===== COMMUNITIES =====
        communities = [
            Community(id="comm-1", name="Frontend", slug="frontend",
                      description="React, Vue, Angular, CSS, браузерные API и всё о фронтенд-разработке.",
                      cover_url="https://images.unsplash.com/photo-1547658719-da2b51169166?w=1200&h=500&fit=crop&q=80",
                      icon_emoji="🎨", member_count=342, material_count=89, activity_score=92, color="#61DAFB",
                      tags=["React", "Vue", "CSS", "TypeScript", "HTML"], created_at=datetime(2025, 8, 1)),
            Community(id="comm-2", name="Backend", slug="backend",
                      description="Java, Python, Go, базы данных, микросервисы, gRPC, REST API.",
                      cover_url="https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&h=500&fit=crop&q=80",
                      icon_emoji="⚙️", member_count=287, material_count=76, activity_score=88, color="#00ADD8",
                      tags=["Java", "Python", "Go", "PostgreSQL", "REST API"], created_at=datetime(2025, 8, 1)),
            Community(id="comm-3", name="DevOps", slug="devops",
                      description="Docker, Kubernetes, CI/CD, Terraform, облака, Linux.",
                      cover_url="https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?w=1200&h=500&fit=crop&q=80",
                      icon_emoji="🚀", member_count=198, material_count=54, activity_score=85, color="#2496ED",
                      tags=["Docker", "Kubernetes", "CI/CD", "Linux", "AWS"], created_at=datetime(2025, 8, 15)),
            Community(id="comm-4", name="Data Science", slug="data-science",
                      description="Нейросети, Pandas, машинное обучение, LLM, аналитика данных.",
                      cover_url="https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=1200&h=500&fit=crop&q=80",
                      icon_emoji="🧠", member_count=256, material_count=67, activity_score=90, color="#FF6F00",
                      tags=["Python", "TensorFlow", "PyTorch", "Pandas", "ML"], created_at=datetime(2025, 8, 15)),
            Community(id="comm-5", name="CyberSecurity", slug="cybersecurity",
                      description="CTF, пентест, безопасность, криптография, reverse engineering.",
                      cover_url="https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200&h=500&fit=crop&q=80",
                      icon_emoji="🔐", member_count=145, material_count=38, activity_score=78, color="#FF1744",
                      tags=["CTF", "Пентест", "Linux", "Cryptography", "Network"], created_at=datetime(2025, 9, 1)),
            Community(id="comm-6", name="Mobile Dev", slug="mobile-dev",
                      description="Kotlin, Swift, Flutter, React Native. Мобильная разработка.",
                      cover_url="https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=1200&h=500&fit=crop&q=80",
                      icon_emoji="📱", member_count=167, material_count=43, activity_score=72, color="#A855F7",
                      tags=["Kotlin", "Swift", "Flutter", "React Native"], created_at=datetime(2025, 9, 15)),
            Community(id="comm-7", name="GameDev", slug="gamedev",
                      description="Unity, Unreal Engine, Godot, Bevy. Разработка игр.",
                      cover_url="https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1200&h=500&fit=crop&q=80",
                      icon_emoji="🎮", member_count=123, material_count=29, activity_score=65, color="#4CAF50",
                      tags=["Unity", "Unreal Engine", "Godot", "C#", "C++"], created_at=datetime(2025, 10, 1)),
        ]
        db.add_all(communities)

        # ===== MATERIALS (first 10) =====
        materials = [
            Material(id="mat-1", title="React Hooks: Полное руководство",
                     description="Исчерпывающий конспект по всем хукам React 18+.",
                     author_id="user-1", cover_url="https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&h=500&fit=crop&q=80",
                     price=30, rating=4.8, rating_count=45, purchase_count=128, language="javascript",
                     technology=["React", "TypeScript"], difficulty="middle", format="article", task_type="lecture-notes",
                     tags=["React", "Hooks", "Frontend", "Конспект"],
                     table_of_contents=["1. useState и useReducer", "2. useEffect", "3. useMemo и useCallback",
                                        "4. useRef", "5. useContext", "6. Кастомные хуки", "7. Compound Components", "8. React 19 хуки"],
                     community_id="comm-1", created_at=datetime(2026, 1, 15)),
            Material(id="mat-2", title="Docker для начинающих: от 0 до деплоя",
                     description="Пошаговое руководство по Docker с нуля до production-ready контейнеров.",
                     author_id="user-3", cover_url="https://images.unsplash.com/photo-1605745341112-85968b19335b?w=800&h=500&fit=crop&q=80",
                     price=45, rating=4.9, rating_count=67, purchase_count=234, language="go",
                     technology=["Docker", "Docker Compose", "Linux"], difficulty="junior", format="article", task_type="lecture-notes",
                     tags=["Docker", "DevOps", "Контейнеры", "Деплой"],
                     table_of_contents=["1. Зачем нужен Docker", "2. Установка", "3. Dockerfile", "4. Docker Compose",
                                        "5. Volumes", "6. Networking", "7. Multi-stage builds", "8. Full-stack деплой"],
                     community_id="comm-3", created_at=datetime(2026, 2, 1)),
            Material(id="mat-3", title="Machine Learning с нуля на Python",
                     description="Полный курс по ML: от математических основ до реальных проектов.",
                     author_id="user-2", cover_url="https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=500&fit=crop&q=80",
                     price=60, rating=4.7, rating_count=38, purchase_count=156, language="python",
                     technology=["scikit-learn", "TensorFlow", "Pandas", "NumPy"], difficulty="middle", format="code", task_type="coursework",
                     tags=["ML", "Python", "Data Science", "Нейросети"],
                     table_of_contents=["1. Введение в ML", "2. Линейная регрессия", "3. Логистическая регрессия",
                                        "4. Деревья решений", "5. Gradient Boosting", "6. Нейронные сети", "7. CNN", "8. Проект"],
                     community_id="comm-4", created_at=datetime(2026, 1, 20)),
            Material(id="mat-4", title="Spring Boot REST API за выходные",
                     description="Практический гайд по созданию production-ready REST API на Spring Boot 3.",
                     author_id="user-7", cover_url="https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&h=500&fit=crop&q=80",
                     price=35, rating=4.5, rating_count=29, purchase_count=89, language="java",
                     technology=["Spring Boot", "PostgreSQL", "JWT"], difficulty="middle", format="code", task_type="pet-project",
                     tags=["Java", "Spring", "REST", "Backend"],
                     table_of_contents=["1. Spring Initializr", "2. Модели и миграции", "3. REST контроллеры",
                                        "4. JWT аутентификация", "5. Валидация", "6. Пагинация", "7. Swagger", "8. Тесты"],
                     community_id="comm-2", created_at=datetime(2025, 12, 10)),
            Material(id="mat-5", title="CTF Writeups: Web Security",
                     description="Подробные разборы 15 задач по веб-безопасности с CTF-соревнований.",
                     author_id="user-5", cover_url="https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&h=500&fit=crop&q=80",
                     price=50, rating=4.8, rating_count=22, purchase_count=67, language="python",
                     technology=["Burp Suite", "SQL", "Linux"], difficulty="senior", format="article", task_type="cheatsheet",
                     tags=["CTF", "Security", "Пентест", "XSS"],
                     table_of_contents=["1. Reflected XSS", "2. Stored XSS", "3. Union SQL Injection",
                                        "4. Blind SQLi", "5. CSRF bypass", "6. SSRF", "7. File Upload", "8. Deserialization"],
                     community_id="comm-5", created_at=datetime(2026, 2, 15)),
            Material(id="mat-7", title="CSS Grid & Flexbox: Шпаргалка",
                     description="Визуальная шпаргалка по CSS Grid и Flexbox с интерактивными примерами.",
                     author_id="user-6", cover_url="https://images.unsplash.com/photo-1507721999472-8ed4421c4af2?w=800&h=500&fit=crop&q=80",
                     price=10, rating=4.9, rating_count=55, purchase_count=312, language="javascript",
                     technology=["CSS", "HTML"], difficulty="junior", format="presentation", task_type="cheatsheet",
                     tags=["CSS", "Grid", "Flexbox", "Layout"],
                     table_of_contents=["1. Grid basics", "2. Grid areas", "3. Grid auto-flow", "4. Flexbox basics",
                                        "5. Responsive patterns"],
                     community_id="comm-1", created_at=datetime(2025, 12, 1)),
            Material(id="mat-8", title="Kubernetes: от Docker до K8s",
                     description="Курс по Kubernetes для тех, кто уже знает Docker.",
                     author_id="user-3", cover_url="https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?w=800&h=500&fit=crop&q=80",
                     price=55, rating=4.8, rating_count=34, purchase_count=98, language="go",
                     technology=["Kubernetes", "Helm", "Docker"], difficulty="senior", format="video", task_type="coursework",
                     tags=["K8s", "DevOps", "Оркестрация"],
                     table_of_contents=["1. Pods и Deployments", "2. Services", "3. ConfigMaps и Secrets",
                                        "4. Helm Charts", "5. Ingress", "6. Мониторинг"],
                     community_id="comm-3", created_at=datetime(2026, 3, 1)),
            Material(id="mat-10", title="Go Concurrency Patterns",
                     description="Горутины, каналы, паттерны конкурентности в Go.",
                     author_id="user-3", cover_url="https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&h=500&fit=crop&q=80",
                     price=40, rating=4.7, rating_count=28, purchase_count=76, language="go",
                     technology=["Go", "Concurrency"], difficulty="senior", format="code", task_type="lecture-notes",
                     tags=["Go", "Concurrency", "Goroutines", "Backend"],
                     table_of_contents=["1. Goroutines", "2. Channels", "3. Select", "4. Context",
                                        "5. Worker Pool", "6. Fan-in/Fan-out"],
                     community_id="comm-2", created_at=datetime(2026, 2, 20)),
            Material(id="mat-16", title="Deep Learning с PyTorch",
                     description="Продвинутый курс по глубокому обучению с PyTorch.",
                     author_id="user-2", cover_url="https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&h=500&fit=crop&q=80",
                     price=65, rating=4.6, rating_count=19, purchase_count=54, language="python",
                     technology=["PyTorch", "CUDA", "Transformers"], difficulty="senior", format="code", task_type="coursework",
                     tags=["DL", "PyTorch", "Нейросети", "AI"],
                     table_of_contents=["1. PyTorch basics", "2. CNN", "3. Transfer Learning",
                                        "4. RNN/LSTM", "5. Transformers", "6. Деплой на FastAPI"],
                     community_id="comm-4", created_at=datetime(2026, 1, 25)),
            Material(id="mat-17", title="TypeScript Advanced Types",
                     description="Продвинутые типы TypeScript: Generics, Conditional Types, Mapped Types.",
                     author_id="user-1", cover_url="https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=800&h=500&fit=crop&q=80",
                     price=35, rating=4.9, rating_count=41, purchase_count=143, language="typescript",
                     technology=["TypeScript"], difficulty="senior", format="article", task_type="lecture-notes",
                     tags=["TypeScript", "Types", "Generics", "Frontend"],
                     table_of_contents=["1. Generics deep dive", "2. Conditional Types", "3. Mapped Types",
                                        "4. Template Literal Types", "5. Infer", "6. Utility Types", "7. Type-safe API client"],
                     community_id="comm-1", created_at=datetime(2026, 2, 5)),
            Material(id="mat-18", title="PostgreSQL: Оптимизация запросов",
                     description="Индексы, EXPLAIN ANALYZE, партиционирование, JSONB.",
                     author_id="user-7", cover_url="https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=800&h=500&fit=crop&q=80",
                     price=40, rating=4.8, rating_count=25, purchase_count=71, language="python",
                     technology=["PostgreSQL", "SQL"], difficulty="senior", format="article", task_type="lecture-notes",
                     tags=["PostgreSQL", "SQL", "Оптимизация", "Индексы"],
                     table_of_contents=["1. EXPLAIN ANALYZE", "2. B-tree индексы", "3. GIN/GiST индексы",
                                        "4. Партиционирование", "5. JSONB", "6. Кейс: ускорение с 2с до 20мс"],
                     community_id="comm-2", created_at=datetime(2026, 3, 5)),
        ]
        db.add_all(materials)

        # ===== TRANSACTIONS =====
        transactions = [
            Transaction(id="tx-1", user_id="user-1", type="reward", amount=50, description="Бонус за регистрацию", created_at=datetime(2025, 9, 1, 10, 0)),
            Transaction(id="tx-2", user_id="user-1", type="purchase", amount=-30, description="Покупка: Docker для начинающих", material_id="mat-2", created_at=datetime(2025, 9, 5, 14, 30)),
            Transaction(id="tx-3", user_id="user-1", type="sale", amount=30, description="Продажа: React Hooks", material_id="mat-1", created_at=datetime(2025, 9, 10, 9, 15)),
            Transaction(id="tx-4", user_id="user-1", type="royalty", amount=15, description="Роялти: React Hooks (5 покупок)", material_id="mat-1", created_at=datetime(2025, 10, 1, 12, 0)),
            Transaction(id="tx-5", user_id="user-1", type="purchase", amount=-60, description="Покупка: ML с нуля на Python", material_id="mat-3", created_at=datetime(2025, 10, 15, 16, 45)),
            Transaction(id="tx-6", user_id="user-1", type="challenge-prize", amount=100, description="Победа: Челлендж Frontend сообщества", created_at=datetime(2025, 11, 1, 18, 0)),
            Transaction(id="tx-7", user_id="user-1", type="sale", amount=30, description="Продажа: React Hooks", material_id="mat-1", created_at=datetime(2025, 11, 15, 10, 30)),
            Transaction(id="tx-8", user_id="user-1", type="purchase", amount=-35, description="Покупка: TypeScript продвинутые типы", material_id="mat-17", created_at=datetime(2026, 1, 10, 13, 20)),
            Transaction(id="tx-9", user_id="user-1", type="royalty", amount=45, description="Роялти: React Hooks (15 покупок)", material_id="mat-1", created_at=datetime(2026, 2, 1, 9, 0)),
            Transaction(id="tx-10", user_id="user-1", type="sale", amount=35, description="Продажа: TypeScript Advanced", material_id="mat-17", created_at=datetime(2026, 3, 1, 11, 0)),
            Transaction(id="tx-11", user_id="user-2", type="reward", amount=50, description="Бонус за регистрацию", created_at=datetime(2025, 10, 15, 10, 0)),
            Transaction(id="tx-12", user_id="user-2", type="sale", amount=60, description="Продажа: ML с нуля", material_id="mat-3", created_at=datetime(2025, 11, 1, 14, 0)),
            Transaction(id="tx-13", user_id="user-3", type="reward", amount=50, description="Бонус за регистрацию", created_at=datetime(2025, 8, 20, 10, 0)),
            Transaction(id="tx-14", user_id="user-3", type="sale", amount=45, description="Продажа: Docker для начинающих", material_id="mat-2", created_at=datetime(2025, 9, 10, 16, 0)),
            Transaction(id="tx-15", user_id="user-4", type="reward", amount=50, description="Бонус за регистрацию", created_at=datetime(2026, 1, 10, 10, 0)),
        ]
        db.add_all(transactions)

        # ===== COMMENTS =====
        comments = [
            Comment(id="com-1", material_id="mat-1", author_id="user-2", text="Отличный конспект! Наконец-то понял useCallback.", rating=5, created_at=datetime(2026, 1, 20, 14, 30)),
            Comment(id="com-2", material_id="mat-1", author_id="user-3", text="Хорошо структурировано. Лучший материал по хукам.", rating=4, created_at=datetime(2026, 1, 22, 9, 15)),
            Comment(id="com-3", material_id="mat-1", author_id="user-4", text="Очень помогло на проекте! Сократила ре-рендеры на 40%.", rating=5, created_at=datetime(2026, 2, 1, 16, 0)),
            Comment(id="com-4", material_id="mat-2", author_id="user-1", text="Лучший гайд по Docker. Чётко, по делу, без воды.", rating=5, created_at=datetime(2026, 2, 5, 11, 0)),
            Comment(id="com-5", material_id="mat-2", author_id="user-5", text="Для начинающих — самое то. Образ уменьшился с 1.2GB до 89MB!", rating=5, created_at=datetime(2026, 2, 10, 13, 45)),
            Comment(id="com-6", material_id="mat-3", author_id="user-1", text="Сложновато для новичка, но если есть Python — идеально.", rating=4, created_at=datetime(2026, 2, 15, 10, 30)),
            Comment(id="com-7", material_id="mat-3", author_id="user-5", text="Финальный проект — реально полезный, добавил в портфолио.", rating=4, created_at=datetime(2026, 2, 20, 14, 0)),
            Comment(id="com-8", material_id="mat-5", author_id="user-3", text="Реально полезные разборы для CTF подготовки.", rating=5, created_at=datetime(2026, 3, 1, 9, 0)),
            Comment(id="com-9", material_id="mat-7", author_id="user-4", text="Повесила на стену! Grid areas — гениально.", rating=5, created_at=datetime(2026, 1, 10, 15, 0)),
            Comment(id="com-10", material_id="mat-8", author_id="user-1", text="K8s наконец стал понятен. Helm Charts — магия.", rating=5, created_at=datetime(2026, 3, 10, 10, 0)),
        ]
        db.add_all(comments)

        # ===== POSTS =====
        posts = [
            Post(id="post-1", community_id="comm-1", author_id="user-1", title="React 19 — что нового?",
                 content="Разбираем новые фичи React 19: Actions, use() хук, улучшенный Suspense.", likes_count=34, comments_count=12,
                 created_at=datetime(2026, 3, 15, 10, 0)),
            Post(id="post-2", community_id="comm-1", author_id="user-6", title="CSS Container Queries на практике",
                 content="Наконец-то поддержка во всех браузерах! Показываю реальные кейсы.", likes_count=28, comments_count=8,
                 created_at=datetime(2026, 3, 14, 14, 0)),
            Post(id="post-3", community_id="comm-2", author_id="user-7", title="Spring Boot 4 vs Quarkus",
                 content="Сравниваю производительность, время старта и DX.", likes_count=41, comments_count=23,
                 created_at=datetime(2026, 3, 13, 9, 0)),
            Post(id="post-4", community_id="comm-3", author_id="user-3", title="Terraform vs Pulumi: что выбрать?",
                 content="IaC в 2026: HCL или TypeScript?", likes_count=52, comments_count=19,
                 created_at=datetime(2026, 3, 12, 16, 0)),
            Post(id="post-5", community_id="comm-4", author_id="user-2", title="LLM Fine-tuning для студенческих задач",
                 content="Файн-тюним модель для автоматической проверки лабораторных.", likes_count=67, comments_count=31,
                 created_at=datetime(2026, 3, 11, 11, 0)),
            Post(id="post-6", community_id="comm-5", author_id="user-5", title="Writeup: HackTheBox — новая машина",
                 content="Разбираем свежую машину на HTB. Privilege escalation.", likes_count=23, comments_count=7,
                 created_at=datetime(2026, 3, 10, 20, 0)),
            Post(id="post-7", community_id="comm-6", author_id="user-4", title="Kotlin Multiplatform — будущее?",
                 content="KMP позволяет шарить бизнес-логику между платформами.", likes_count=19, comments_count=6,
                 created_at=datetime(2026, 3, 9, 13, 0)),
            Post(id="post-8", community_id="comm-7", author_id="user-8", title="Godot 4.3 — наконец стабильный?",
                 content="Обзор новой версии Godot.", likes_count=15, comments_count=9,
                 created_at=datetime(2026, 3, 8, 15, 0)),
            Post(id="post-9", community_id="comm-1", author_id="user-1", title="Челлендж: Лучший UI за 48 часов",
                 content="🏆 Создайте лендинг для стартапа. Приз: 200 CodeCoins.", likes_count=45, comments_count=16,
                 created_at=datetime(2026, 3, 7, 10, 0)),
            Post(id="post-10", community_id="comm-3", author_id="user-3", title="Docker tips & tricks",
                 content="10 неочевидных лайфхаков для Docker.", likes_count=38, comments_count=11,
                 created_at=datetime(2026, 3, 6, 17, 0)),
        ]
        db.add_all(posts)

        # ===== CHAT CHANNELS =====
        channels = [
            ChatChannel(id="ch-general", name="Общий чат", description="Общие обсуждения платформы", icon="💬", is_general=True),
            ChatChannel(id="ch-frontend", name="Frontend", description="Обсуждения фронтенда", icon="🎨", community_id="comm-1"),
            ChatChannel(id="ch-backend", name="Backend", description="Обсуждения бэкенда", icon="⚙️", community_id="comm-2"),
            ChatChannel(id="ch-devops", name="DevOps", description="Обсуждения DevOps", icon="🚀", community_id="comm-3"),
            ChatChannel(id="ch-datascience", name="Data Science", description="Обсуждения DS/ML", icon="🧠", community_id="comm-4"),
            ChatChannel(id="ch-security", name="CyberSecurity", description="Обсуждения безопасности", icon="🔐", community_id="comm-5"),
        ]
        db.add_all(channels)

        await db.commit()
        print("✅ Database seeded successfully!")
        print(f"   - {len(users_data)} users (password: {DEFAULT_PASSWORD})")
        print(f"   - {len(achievements)} achievements")
        print(f"   - {len(communities)} communities")
        print(f"   - {len(materials)} materials")
        print(f"   - {len(transactions)} transactions")
        print(f"   - {len(comments)} comments")
        print(f"   - {len(posts)} posts")
        print(f"   - {len(channels)} chat channels")


if __name__ == "__main__":
    asyncio.run(seed())
