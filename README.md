<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi&logoColor=white" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white" />
  <img src="https://img.shields.io/badge/Kafka-Events-231F20?logo=apachekafka&logoColor=white" />
  <img src="https://img.shields.io/badge/OpenRouter-AI-8B5CF6?logo=openai&logoColor=white" />
</p>

# IT-RE:SOURCE + GrowGrade

> Образовательная платформа для IT-специалистов с внутренней валютой CodeCoins, AI-анализом когнитивных процессов (GrowGrade), RAG-поиском по документам и микросервисной архитектурой на 7 сервисах.

---

## Что это?

**IT-RE:SOURCE** — маркетплейс образовательных материалов, где пользователи публикуют и покупают курсы, статьи и видео за внутреннюю валюту CodeCoins. Платформа включает чат, сообщества, менторов, задачи с IDE в браузере и AI Code Review.

**GrowGrade** — уникальная фича платформы: AI-система анализа **процесса мышления** разработчика. Вместо того чтобы оценивать только финальный код, GrowGrade анализирует *как* человек думает при решении задач — записывает ход мыслей (Thinking Log), замеряет время и через LLM оценивает когнитивные паттерны.

---

## Технологический стек

| Слой | Технологии |
|------|-----------|
| **Frontend** | React 19, TypeScript, Redux Toolkit, Tailwind CSS, Framer Motion, Lucide Icons, Vite |
| **Backend** | Python 3.12, FastAPI, SQLAlchemy (async), Pydantic v2, JWT (python-jose), aiokafka |
| **Search / RAG** | ChromaDB, rank-bm25, OpenRouter API (embeddings + LLM), pypdf, HuggingFace (fallback) |
| **Инфраструктура** | Docker Compose, Nginx (API gateway), PostgreSQL 16, Redis, Apache Kafka + Zookeeper |
| **CI/CD** | GitHub Actions, SSH deploy, multi-stage Docker builds |

---

## Архитектура

### Микросервисы

```
┌──────────────────────────────────────────────────────────────┐
│                    NGINX GATEWAY (:8000)                      │
│    Rate limiting (auth: 5r/s, search: 10r/s, general: 30r/s)│
│    Security headers ∙ /api/internal/ → 403 blocked           │
└────┬──────┬──────┬──────┬──────┬──────┬──────┬───────────────┘
     │      │      │      │      │      │      │
     ▼      ▼      ▼      ▼      ▼      ▼      ▼
   auth  content  comm.  txn   notif.  chat  search
   svc    svc     svc    svc    svc    svc    svc
     │      │      │      │      │      │      │
     └──────┴──────┴──────┴──────┴──────┘      │
                    │                           │
                    ▼                           ▼
              ┌──────────┐              ┌──────────────┐
              │  KAFKA   │              │  ChromaDB +  │
              │ 7 topics │              │  OpenRouter  │
              └──────────┘              └──────────────┘
                    │
              ┌─────┴─────┐
              ▼           ▼
         PostgreSQL    Redis
         (7 баз)     (pub/sub)
```

| Сервис | Порт | Описание |
|--------|------|----------|
| **auth_service** | 8000 | JWT-аутентификация, пользователи, профили, менторы, бронирование, загрузка файлов |
| **content_service** | 8000 | Материалы, уроки, комментарии, задачи, GrowGrade AI-анализ, расписание, роадмап |
| **community_service** | 8000 | Сообщества, посты, лайки, проекты |
| **transaction_service** | 8000 | Транзакции CodeCoins, достижения |
| **notification_service** | 8000 | Kafka consumer → уведомления в БД |
| **chat_service** | 8000 | Каналы, сообщения, реакции, WebSocket + Redis pub/sub |
| **search_service** | 8000 | BM25 + ChromaDB hybrid search, RAG-ассистент, PDF-индексация |

### Frontend (Feature Sliced Design)

```
frontend/src/
├── app/              Store (Redux), Routing (27 маршрутов), Providers
├── pages/            27 страниц с lazy-loading и Suspense
│   ├── landing/      Главная с анимациями
│   ├── tasks/        Задачи + CodeIDE + Thinking Log + AI Review
│   ├── growgrade/    GrowGrade: история анализов, когнитивные метрики
│   ├── mentors/      Менторы с бронированием и оплатой CodeCoins
│   ├── smart-search/ RAG-поиск с AI-ассистентом
│   ├── chat/         Real-time чат через WebSocket
│   ├── profile/      Профиль с когнитивным профилем GrowGrade
│   └── ...           Каталог, сообщества, проекты, roadmap, расписание
├── features/         Auth, search, filter, buy-material, course-progress
├── entities/         Material, User, Community, Transaction, Achievement
├── shared/
│   ├── api/          API-клиент (35+ методов ко всем микросервисам)
│   ├── ui/           15 переиспользуемых компонентов (GlassCard, Badge, Button...)
│   ├── config/       Маршруты, константы
│   └── lib/          Утилиты (cn, formatDate, formatPrice)
└── widgets/          Header, Footer
```

---

## Возможности

### GrowGrade — AI-анализ мышления

GrowGrade — ядро платформы, которое отличает её от обычных образовательных сервисов. Вместо оценки «правильно/неправильно» система анализирует **когнитивный процесс** разработчика.

| Функция | Описание |
|---------|----------|
| **Thinking Log** | Боковая панель в IDE для записи хода мыслей в реальном времени |
| **Таймер** | Автоматический старт при начале кодирования, останов при успешном решении |
| **AI-анализ** | OpenRouter LLM анализирует thinking log + код + время и возвращает структурированную оценку |
| **5 когнитивных метрик** | Декомпозиция задач, проверка гипотез, уровень абстракции, подход к отладке, управление временем |
| **Грейд-детекция** | Автоматическое определение уровня мышления: Junior / Middle / Senior |
| **Сохранение в БД** | Каждый анализ сохраняется для отслеживания прогресса |
| **Страница /growgrade** | Агрегированные метрики, история анализов, AI-саммари когнитивного профиля |
| **Профиль пользователя** | Когнитивный профиль виден менторам для персонализации обучения |
| **Фильтр по грейду** | Задачи фильтруются по уровню: Junior (easy), Middle (easy+medium), Senior (все) |

### Платформа IT-RE:SOURCE

| Модуль | Описание |
|--------|----------|
| **Каталог материалов** | Курсы, статьи, видео. Фильтры по языку, сложности, формату. Покупка за CodeCoins |
| **CodeCoins** | Внутренняя валюта. Зарабатывай публикацией материалов, трать на покупки и менторов |
| **Задачи** | Алгоритмы, теория, system design. Встроенный IDE, тесты, AI Code Review |
| **Менторы** | Профили менторов, бронирование сессий с автоматическим списанием CodeCoins |
| **Smart Search** | Гибридный поиск (BM25 + ChromaDB embeddings) по загруженным PDF-документам |
| **RAG-ассистент** | AI-чат с контекстом из найденных документов |
| **Сообщества** | 7 IT-кластеров (Frontend, Backend, DevOps, Data Science, Security, Mobile, GameDev) |
| **Чат** | Каналы, сообщения, реакции, ответы. WebSocket + Redis pub/sub |
| **Профили** | Рейтинг, радар навыков, стек технологий, уровни, достижения |
| **Геймификация** | Достижения (common / rare / epic / legendary), рейтинги авторов |
| **Roadmap** | Визуальная карта обучения на React Flow |
| **Проекты** | Командные проекты с ролями и описанием |
| **Расписание** | Стримы, вебинары, воркшопы |
| **Уведомления** | Kafka-driven: регистрация, покупки, комментарии, достижения |

---

## Запуск

### Предварительные требования

- Docker и Docker Compose
- Node.js 18+ (для фронтенда в dev-режиме)
- (Опционально) `OPENROUTER_API_KEY` для AI-фич (GrowGrade, RAG, Code Review)

### 1. Запуск микросервисов

```bash
cd services/

# Создать .env из примера
cp .env.example .env

# Обязательно отредактировать:
#   SECRET_KEY           — JWT-ключ (любая длинная строка)
#   POSTGRES_PASSWORD    — пароль для PostgreSQL
#   OPENROUTER_API_KEY   — ключ для AI-фич (growgrade, RAG, code review)

# Запуск всех сервисов (7 микросервисов + nginx + postgres + redis + kafka)
docker compose up -d --build

# Проверить что все контейнеры healthy
docker compose ps
```

### 2. Сидирование базы данных

```bash
# Пользователи и менторы
docker exec services-auth_service-1 python seed.py
docker exec services-auth_service-1 python seed_mentors.py

# Материалы и задачи
docker exec services-content_service-1 python seed.py
docker exec services-content_service-1 python seed_extra.py

# Сообщества и проекты
docker exec services-community_service-1 python seed.py
docker exec services-community_service-1 python seed_projects.py

# Чат-каналы
docker exec services-chat_service-1 python seed.py
```

### 3. Запуск фронтенда (dev)

```bash
cd frontend/
npm install
npm run dev    # http://localhost:5173
```

В `frontend/.env.development` должно быть:
```env
VITE_API_BASE=http://localhost:8000/api
```

### 4. Продакшен

В продакшене фронтенд собирается в Docker-контейнер (multi-stage build) и раздаётся через nginx. Все запросы `/api/` проксируются на gateway.

```bash
# Полный стек (включая фронтенд)
docker compose up -d --build
```

> **Важно:** Не поднимайте отдельный микросервис на порт 8000 — всегда используйте nginx gateway из `services/docker-compose.yml`.

---

## Тестовые аккаунты

Пароль для всех: `password123`

| Username | Имя | Описание | Уровень |
|----------|-----|----------|---------|
| alexdev | Алексей Петров | React, TypeScript, Go | Эксперт |
| mashka_ds | Мария Козлова | Python, Pandas, TensorFlow | Продвинутый |
| dima_devops | Дмитрий Волков | Docker, K8s, CI/CD | Гуру |
| anna_mobile | Анна Сидорова | Kotlin, Flutter, Dart | Новичок |

---

## API

### Документация

Swagger UI доступен через nginx gateway:
- **Auth:** `http://localhost:8000/api/auth/docs`
- **Content:** `http://localhost:8000/api/materials/../docs`
- **Search:** `http://localhost:8000/api/search/docs`

### Основные эндпоинты

#### Аутентификация
| Метод | Путь | Описание |
|-------|------|----------|
| POST | `/api/auth/register` | Регистрация нового пользователя |
| POST | `/api/auth/login` | Авторизация (возвращает JWT) |
| GET | `/api/auth/me` | Текущий пользователь |
| PATCH | `/api/users/me` | Обновление профиля |

#### Материалы и уроки
| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/materials/` | Каталог (пагинация, фильтры) |
| GET | `/api/materials/{id}` | Детали материала |
| POST | `/api/materials/` | Создание материала |
| POST | `/api/materials/{id}/purchase` | Покупка за CodeCoins |
| GET | `/api/materials/{id}/lessons/` | Уроки курса |
| POST | `/api/materials/{id}/comments/` | Оставить комментарий |

#### GrowGrade
| Метод | Путь | Описание |
|-------|------|----------|
| POST | `/api/tasks/{id}/analyze-thinking` | AI-анализ мышления (JWT) |
| GET | `/api/tasks/growgrade/history` | История анализов пользователя (JWT) |
| GET | `/api/tasks/growgrade/summary` | AI-саммари когнитивного профиля (JWT) |
| GET | `/api/tasks/growgrade/user/{id}/summary` | Публичное саммари для менторов |

#### Задачи
| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/tasks/` | Список задач (фильтр: difficulty, category) |
| POST | `/api/tasks/{id}/run` | Запуск кода на тесте |
| POST | `/api/tasks/{id}/submit` | Отправка решения на все тесты |
| POST | `/api/tasks/{id}/review` | AI Code Review |
| POST | `/api/tasks/{id}/check` | Проверка ответа (теория) |

#### Менторы
| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/mentors/` | Список менторов |
| GET | `/api/mentors/{id}` | Профиль ментора |
| POST | `/api/mentors/{id}/book` | Бронирование (списание CodeCoins) |
| GET | `/api/mentors/bookings/my` | Мои бронирования |

#### Smart Search & RAG
| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/search/?q=...&top_k=10` | Гибридный поиск (BM25 + embeddings) |
| POST | `/api/search/assistant/ask` | RAG AI-ассистент с контекстом |
| POST | `/api/upload/` | Загрузка PDF для индексации |

#### Чат, сообщества, транзакции
| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/chat/channels/` | Каналы чата |
| WS | `/api/ws/chat/{channel_id}` | WebSocket подключение |
| GET | `/api/communities/` | Сообщества |
| POST | `/api/communities/{slug}/join` | Вступить в сообщество |
| GET | `/api/transactions/balance` | Баланс CodeCoins |
| GET | `/api/achievements/my` | Мои достижения |

---

## Kafka-топики

| Топик | Продюсер | Консьюмеры | Описание |
|-------|----------|------------|----------|
| `user.registered` | auth_service | txn_service, notif_service | Начисление стартовых CodeCoins, приветственное уведомление |
| `material.created` | content_service | search_service, notif_service | Индексация в поиске, уведомление |
| `material.purchased` | content_service | notif_service | Уведомление о покупке |
| `comment.created` | content_service | notif_service | Уведомление автору материала |
| `community.joined` | community_service | notif_service | Уведомление о вступлении |
| `achievement.unlocked` | txn_service | auth_service | Синхронизация достижений |

---

## Переменные окружения

Все переменные документированы в [`services/.env.example`](services/.env.example).

| Переменная | Где используется | Описание | Обязательно |
|------------|-----------------|----------|-------------|
| `SECRET_KEY` | Все сервисы | JWT-ключ для подписи токенов | Да |
| `POSTGRES_USER` | PostgreSQL | Пользователь БД | Рекомендуется |
| `POSTGRES_PASSWORD` | PostgreSQL | Пароль БД | Да |
| `OPENROUTER_API_KEY` | search_service, content_service | API-ключ для AI (GrowGrade, RAG, embeddings, Code Review) | Да |
| `HUGGINGFACE_API_KEY` | search_service | Fallback LLM | Опционально |
| `INTERNAL_SERVICE_TOKEN` | auth_service | Токен для внутренних межсервисных запросов | Рекомендуется |
| `CORS_ORIGINS` | Все сервисы | Разрешённые origins (по умолчанию `*`) | Рекомендуется |
| `SEARCH_INDEX_SECRET` | content ↔ search | Токен для индексации | Рекомендуется |

---

## Безопасность

- JWT-аутентификация с bcrypt-хешированием паролей
- `SECRET_KEY` вынесен в переменные окружения
- Internal API (`/api/internal/`) защищён `X-Service-Token` + nginx блокирует извне
- Nginx rate limiting: auth 5 req/s, search 10 req/s, general 30 req/s
- Security headers: X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy
- CORS настраивается через env-переменные
- JWT-авторизация на чувствительных эндпоинтах search_service

---

## Структура проекта

```
IDEA-CODE/
├── frontend/                    React 19 SPA
│   ├── src/
│   │   ├── app/                 Store, Routing (27 маршрутов), Providers
│   │   ├── entities/            5 entity-слайсов
│   │   ├── features/            5 features (auth, search, filter, buy, progress)
│   │   ├── pages/               27 страниц (lazy-loading)
│   │   ├── shared/              API-клиент, 15 UI-компонентов, типы, утилиты
│   │   └── widgets/             Header, Footer
│   ├── Dockerfile               Multi-stage build (Node → Nginx)
│   └── package.json
│
├── services/                    Микросервисы
│   ├── auth_service/            JWT, users, mentors, uploads, internal API
│   ├── content_service/         Materials, lessons, tasks, GrowGrade, schedule
│   ├── community_service/       Communities, posts, projects
│   ├── transaction_service/     CodeCoins, achievements
│   ├── notification_service/    Kafka consumer → notifications
│   ├── chat_service/            Channels, messages, WebSocket + Redis
│   ├── search_service/          BM25 + ChromaDB + RAG + Kafka
│   ├── nginx/nginx.conf         API gateway + rate limiting
│   ├── postgres/init-databases.sh   Создание 7 БД
│   ├── docker-compose.yml       Healthchecks, depends_on, volumes
│   └── .env.example             Документация env-переменных
│
├── .github/workflows/ci.yml    CI/CD pipeline
├── CLAUDE.md                    Аудит кодовой базы
└── README.md
```
