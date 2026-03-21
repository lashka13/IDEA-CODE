# CLAUDE.md — IT-RE:SOURCE: Аудит кодовой базы

> Дата аудита: 2026-03-21. Обновлено: 2026-03-21. Ветка: `ydzaretsky3`.

---

## Обзор проекта

IT-RE:SOURCE — образовательная платформа для IT-специалистов с внутренней валютой CodeCoins, каталогом курсов, чатом, сообществами, RAG-поиском по PDF и AI-ассистентом. Проект состоит из **React 19 SPA-фронтенда** и **микросервисного бэкенда** (7 сервисов на FastAPI + nginx-шлюз + Kafka + PostgreSQL + Redis + ChromaDB).

**Текущий статус:** Бэкенд-микросервисы функциональны и покрывают основные сценарии. Фронтенд структурирован и корректно отображает ошибки при падении бэкенда. RAG-пайплайн работает с персистентным ChromaDB. Секреты вынесены в переменные окружения. Nginx настроен с rate limiting и security headers. CI/CD собирает все сервисы включая search_service. Мёртвый монолитный API (`/api/`) удалён.

**Остаётся:** Нет тестов. Alembic-миграции не настроены. WebSocket auth через query parameter. Seed-скрипты не идемпотентны.

---

## Статус готовности по слоям

| Слой / Модуль | Статус | Пояснение |
|---|---|---|
| **Frontend: UI-компоненты** | ✅ работает | 15 shared-компонентов, все используются |
| **Frontend: API-клиент** | ✅ работает | 30+ методов, AI-страница переключена на микросервисы |
| **Frontend: Redux-стейт** | ✅ работает | Все entity-слайсы инициализируются пустыми, ошибки отображаются |
| **Frontend: Роутинг** | ✅ работает | 26 роутов, lazy-loading, Suspense |
| **auth_service** | ✅ работает | Регистрация, JWT, профили, менторы, загрузка файлов |
| **content_service** | ✅ работает | Материалы, уроки, комментарии, задачи, расписание, роадмап |
| **chat_service** | ✅ работает | Каналы, сообщения, реакции, WebSocket + Redis pub/sub |
| **community_service** | ✅ работает | Сообщества, посты, лайки, проекты |
| **transaction_service** | ✅ работает | Транзакции CodeCoins, ачивки |
| **notification_service** | ✅ работает | Kafka-consumer → уведомления в БД |
| **search_service: BM25** | ✅ работает | In-memory BM25Okapi с русскими/английскими стоп-словами |
| **search_service: embeddings** | ✅ работает | OpenRouter API. При сбое — ошибка пробрасывается, нулевые векторы не сохраняются |
| **search_service: ChromaDB** | ✅ работает | Коллекция персистентна, не удаляется при рестарте |
| **search_service: RAG** | ⚠️ частично | Работает при наличии OPENROUTER_API_KEY, иначе — fallback на HuggingFace, затем — ошибка |
| **search_service: auth** | ✅ работает | JWT аутентификация на `/assistant/ask`, `DELETE /documents`, `/index/rebuild` |
| **CI/CD** | ✅ работает | Собирает все 7 сервисов + frontend, health polling вместо sleep |
| **Docker Compose** | ✅ работает | Healthchecks на всех контейнерах, `service_healthy` зависимости |
| **Аутентификация** | ✅ работает | SECRET_KEY вынесен в env, internal endpoints защищены service-token + nginx |
| **Nginx** | ✅ работает | Rate limiting, security headers, блокировка `/api/internal/` |
| **База данных** | ⚠️ частично | 7 БД создаются, таблицы через SQLAlchemy. Alembic в зависимостях, но **миграции не настроены** |
| **Kafka** | ✅ работает | Топики: `user.registered`, `material.*`, `comment.created`, `community.joined`, `achievement.unlocked` |

---

## Оставшиеся проблемы

### ВЫСОКОПРИОРИТЕТНЫЕ

#### 1. Нет тестов
- **Где:** весь проект
- **Проблема:** Ни одного теста ни в одном сервисе, ни на фронтенде.
- **Что нужно сделать:** Начать с интеграционных тестов на критические эндпоинты (auth, покупка).

#### 2. Alembic установлен, но миграции не настроены
- **Где:** `services/*/requirements.txt` — `alembic==1.14.1` во всех сервисах
- **Проблема:** Нет `alembic.ini`, `versions/`, вызовов `alembic upgrade`. Таблицы создаются через `Base.metadata.create_all`.
- **Эффект:** При изменении схемы данные теряются или таблицы не обновляются.
- **Что нужно сделать:** Инициализировать alembic в каждом сервисе.

#### 3. WebSocket аутентификация через query parameter
- **Где:** `services/chat_service/src/messages/routers.py`
- **Проблема:** JWT-токен передаётся в URL (`?token=...`). URL логируется в nginx, браузере, прокси.
- **Что нужно сделать:** Использовать первое сообщение WebSocket для передачи токена.

#### 4. Seed-скрипты не идемпотентны
- **Где:** `services/auth_service/seed.py`, `services/content_service/seed.py`, и т.д.
- **Проблема:** Повторный запуск seed может упасть с duplicate key или создать дубликаты.
- **Что нужно сделать:** Добавить `ON CONFLICT DO NOTHING` или проверку существования.

#### 5. `seed_mentors.py` ссылается на несуществующих пользователей
- **Где:** `services/auth_service/seed_mentors.py`
- **Проблема:** 2 ментора ссылаются на user_id которых нет в seed.py.

### СРЕДНИЕ

#### 6. `deadline` в проектах — строка вместо datetime
- **Где:** `services/community_service/src/projects/models.py:19`
- **Проблема:** `deadline = Column(String)` — невозможно сортировать/фильтровать по дате.

#### 7. Денормализация без автосинхронизации
- **Где:** `services/community_service/src/communities/models.py:16-18`
- **Проблема:** `member_count`, `material_count`, `activity_score` хранятся как колонки, но обновляются не везде.

#### 8. Роуты не используют константы ROUTES
- **Где:** `frontend/src/shared/config/routes.ts` определяет `ROUTES`, но в компонентах используются хардкод-строки.

#### 9. Даты в mock schedule устарели
- **Где:** `frontend/src/shared/api/mocks/schedule.ts`
- **Проблема:** Все `startsAt` — январь 2025 (прошлое).

#### 10. Redis в зависимостях но не используется в 3 сервисах
- **Где:** `services/content_service/requirements.txt`, `services/notification_service/requirements.txt`, `services/transaction_service/requirements.txt`
- **Проблема:** `redis[hiredis]` в зависимостях, но в коде сервисов Redis не используется.

#### 11. Seed использует raw SQL для миграции
- **Где:** `services/community_service/seed_projects.py`
- **Проблема:** `ALTER TABLE projects ADD COLUMN IF NOT EXISTS cover_url` в seed-скрипте.
- **Что нужно сделать:** Вынести в alembic-миграцию.

---

## Что было исправлено

### Фаза 1: Безопасность
- **SECRET_KEY** → вынесен в env через `${SECRET_KEY:-...}` в docker-compose, настраивается через `.env`
- **DB credentials** → вынесены в env (`${POSTGRES_USER:-postgres}`, `${POSTGRES_PASSWORD:-postgres}`)
- **Internal endpoints** → защищены `X-Service-Token` header + `INTERNAL_SERVICE_TOKEN` в конфиге + nginx блокирует `/api/internal/` извне
- **Search endpoints** → добавлен `get_current_user_id` (JWT) на `/assistant/ask`, `DELETE /documents`, `/index/rebuild`
- **CORS** → `allow_origins=settings.CORS_ORIGINS` (настраивается через env) во всех 7 сервисах
- **Nginx** → rate limiting (auth: 5r/s, search: 10r/s, general: 30r/s) + security headers (X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy)
- **`.env.example`** → создан с документацией всех env-переменных

### Фаза 2: Критические баги
- **ChromaDB** → удалён `delete_collection()` из конструктора `VectorIndex`, коллекция теперь персистентна
- **Embedding fallback** → вместо нулевых векторов теперь пробрасывается исключение, батч не сохраняется
- **CI/CD** → добавлен `Build search_service` шаг; `sleep 15` заменён на polling health endpoints (30 попыток, 2с интервал)

### Фаза 3: Фронтенд
- **Redux initialState** → моки убраны из `materialsSlice`, `userSlice`, `communitiesSlice`, `transactionsSlice`, `achievementsSlice`; `items: []` + `error: null`
- **Ошибки API** → добавлено отображение ошибок при rejected (error state + selector)
- **DEFAULT_PASSWORD** → скрыт за `import.meta.env.DEV` (только в dev-режиме)
- **AI Search** → `aiSearch`/`aiChat`/`aiIndexMaterial` методы удалены, AISearchPage переключена на `smartSearch` (микросервисы)
- **Дубль `updateProfile`** → удалён

### Фаза 4: Инфраструктура
- **Docker healthchecks** → добавлены для всех 7 сервисов, nginx, zookeeper
- **Зависимости** → search_service зависит от auth/content через `service_healthy`
- **`seed_projects.py`** → `ALTER TABLE` заменён на `ADD COLUMN IF NOT EXISTS`, `except: pass` → `except Exception as e: print(...)`
- **`bare except`** → исправлены в `chat_service/messages/routers.py` (добавлен logging)

### Фаза 5: Удаление мёртвого кода
- **Удалён `/api/`** — весь монолитный API
- **Удалён корневой `docker-compose.yml`** — ссылался на сломанный монолит
- **Удалены пустые файлы:** `utils.py` в auth/chat/community сервисах, `service_clients.py` в auth/chat
- **Удалены пустые `kafka_consumer.py`** в chat/community/content (+ убраны их импорты из `main.py`)
- **Удалён `httpx`** из зависимостей auth_service и community_service

---

## Карта зависимостей между модулями

```
                    ┌──────────────────────────────────────────────┐
                    │                 NGINX GATEWAY (:8000)        │
                    │    /api/auth → auth     /api/search → search │
                    │    /api/materials → content   /ws → chat     │
                    │    Rate limiting + Security headers           │
                    │    /api/internal/ → 403 (blocked)            │
                    └──────┬──────┬──────┬──────┬──────┬──────┬────┘
                           │      │      │      │      │      │
           ┌───────────────┤      │      │      │      │      │
           ▼               ▼      ▼      ▼      ▼      ▼      │
     ┌──────────┐   ┌─────────┐ ┌──────┐ ┌────┐ ┌─────┐ ┌────┐│
     │auth_svc  │   │content  │ │comm. │ │txn │ │notif│ │chat││
     │JWT,users │   │materials│ │posts │ │coins│ │kafka│ │ws  ││
     │mentors   │   │lessons  │ │proj. │ │ach. │ │     │ │    ││
     │uploads   │   │tasks    │ │      │ │     │ │     │ │    ││
     │internal/ │   │         │ │      │ │     │ │     │ │    ││
     │(svc-tok) │   │         │ │      │ │     │ │     │ │    ││
     └──────┬───┘   └────┬────┘ └──┬───┘ └──┬──┘ └──┬──┘ └──┬─┘│
            │             │        │        │       │       │   │
            ▼             ▼        ▼        ▼       ▼       ▼   │
     ┌──────────────────────────────────────────────────────────┐│
     │                     KAFKA                                ││
     │ user.registered → txn_svc, notif_svc                    ││
     │ material.* → search_svc, notif_svc                      ││
     │ comment.created → notif_svc                              ││
     │ community.joined → notif_svc                             ││
     │ achievement.unlocked → auth_svc                          ││
     └─────────────────────────────────────────────────────────┘│
                                                                 │
     ┌──────────────────────────────────────────────────────────┐│
     │                 search_service (JWT auth)                ││
     │  content_svc ──HTTP──→ [sync_content] ──→ BM25 + Chroma ││
     │  auth_svc ───HTTP──→ [PDF download]                     ││
     │  OpenRouter API ──→ [embeddings + LLM]                   ││
     └──────────────────────────────────────────────────────────┘│
                                                                 │
     ┌───────────────────────┐  ┌──────────────┐                │
     │     PostgreSQL        │  │    Redis      │                │
     │ auth_db, content_db,  │  │ db0-5 per svc│                │
     │ community_db, txn_db, │  │ (chat pub/sub)│               │
     │ notif_db, chat_db,    │  │              │                │
     │ search_db             │  │              │                │
     └───────────────────────┘  └──────────────┘                │
                                                                 │
     ┌──────────────────────────────────────────────────────────┐│
     │              frontend (React 19 SPA)                     ││
     │  Vite dev proxy → :8000  |  Nginx prod → gateway         ││
     │  Redux: 10 слайсов (пустой initialState + error state)   ││
     │  API client: 30+ методов → микросервисы                  ││
     └──────────────────────────────────────────────────────────┘│
```

---

## Как запустить проект

### Микросервисы

```bash
cd services/

# Создать .env из примера
cp .env.example .env
# Отредактировать .env: задать SECRET_KEY, POSTGRES_PASSWORD, OPENROUTER_API_KEY и др.

# Запуск всех сервисов
docker compose up -d --build

# Подождать пока healthchecks пройдут (все сервисы станут healthy)
docker compose ps  # проверить статус

# Сидирование БД
docker exec services-auth_service-1 python seed.py
docker exec services-auth_service-1 python seed_mentors.py
docker exec services-content_service-1 python seed.py
docker exec services-content_service-1 python seed_extra.py
docker exec services-community_service-1 python seed.py
docker exec services-community_service-1 python seed_projects.py
docker exec services-chat_service-1 python seed.py
```

### Фронтенд (dev-режим)

```bash
cd frontend/
npm install
# Убедиться, что .env.development содержит:
# VITE_API_BASE=http://localhost:8000/api
npm run dev
# Открыть http://localhost:5173
```

### Обязательные ENV-переменные для продакшена

| Переменная | Где используется | Дефолт | Нужно менять? |
|---|---|---|---|
| `SECRET_KEY` | Все сервисы (JWT) | `super-secret-key-...` | ДА |
| `POSTGRES_USER` | PostgreSQL | `postgres` | Рекомендуется |
| `POSTGRES_PASSWORD` | PostgreSQL | `postgres` | ДА |
| `INTERNAL_SERVICE_TOKEN` | auth_service internal API | пусто | ДА |
| `CORS_ORIGINS` | Все сервисы | `["*"]` | ДА |
| `OPENROUTER_API_KEY` | search_service | Пусто | Да (для RAG/embeddings) |
| `HUGGINGFACE_API_KEY` | search_service | Пусто | Опционально (fallback LLM) |
| `SEARCH_INDEX_SECRET` | content ↔ search | `search-service-internal` | Рекомендуется |

Все переменные документированы в `services/.env.example`.

### Тестовые аккаунты (после seed)

| Username | Password | Описание |
|---|---|---|
| alexdev | password123 | Разработчик |
| mashka_ds | password123 | Data Scientist |
| dima_devops | password123 | DevOps |
| anna_mobile | password123 | Mobile Dev |

---

## Что НЕ трогать

Эти части работают корректно и не требуют изменений:

- **Frontend UI-компоненты** (`frontend/src/shared/ui/`) — 15 компонентов, все используются
- **Frontend роутинг** (`frontend/src/app/routing/`) — lazy-loading, Suspense, 26 маршрутов
- **Frontend сборка** — multi-stage Docker, Vite, Tailwind
- **auth_service CRUD** — регистрация, логин, JWT, профили
- **content_service CRUD** — материалы, уроки, комментарии, покупки с Kafka events
- **community_service CRUD** — сообщества, посты, лайки
- **chat_service WebSocket** — каналы, сообщения, реакции, Redis pub/sub
- **notification_service Kafka consumer** — корректно обрабатывает 5 типов событий
- **transaction_service** — транзакции и ачивки
- **search_service: BM25 индекс** — корректная реализация
- **search_service: chunker** — рекурсивный чанкинг с overlap
- **search_service: PDF extract** — pypdf, надёжная обработка ошибок
- **search_service: hybrid search RRF** — Reciprocal Rank Fusion
- **search_service: content sync** — пагинированный фетч + индексация
- **search_service: Kafka listener** — реиндексация при изменении материалов
- **Nginx** — маршрутизация, rate limiting, security headers, блокировка internal
- **PostgreSQL init** (`init-databases.sh`) — создание 7 БД
- **package.json** — все зависимости используются

---

## Технологический стек

| Слой | Технологии |
|---|---|
| Frontend | React 19, Vite, TypeScript, Redux Toolkit, Tailwind CSS, Framer Motion, Lucide Icons, XYFlow |
| Backend | Python 3.12, FastAPI, SQLAlchemy (async), Pydantic v2, python-jose (JWT), aiokafka |
| Search/RAG | ChromaDB, rank-bm25, OpenRouter API (embeddings + LLM), pypdf, HuggingFace (fallback) |
| Infrastructure | Docker Compose, Nginx, PostgreSQL 16, Redis, Apache Kafka + Zookeeper |
| CI/CD | GitHub Actions, SSH deploy |

---

## Архитектура проекта

```
IDEA-CODE/
├── frontend/                 # ✅ React 19 SPA
│   ├── src/
│   │   ├── app/              #    Store, Routing, Providers, DataLoader
│   │   ├── entities/         #    material, user, community, transaction, achievement
│   │   ├── features/         #    auth, search, filter, buy-material, course-progress
│   │   ├── pages/            #    26 страниц
│   │   ├── shared/           #    api/client, api/mocks, ui/, config/, lib/
│   │   └── widgets/          #    header, footer
│   ├── Dockerfile, nginx.conf, vite.config.ts
│   └── package.json
│
├── services/                 # ✅ Микросервисы (prod-архитектура)
│   ├── auth_service/         #    JWT, users, mentors, uploads, internal API (svc-token)
│   ├── content_service/      #    materials, lessons, comments, tasks, schedule, roadmap
│   ├── community_service/    #    communities, posts, projects
│   ├── transaction_service/  #    transactions, achievements
│   ├── notification_service/ #    Kafka consumer → notifications
│   ├── chat_service/         #    channels, messages, WebSocket
│   ├── search_service/       #    BM25 + ChromaDB + RAG + Kafka indexer (JWT auth)
│   ├── nginx/nginx.conf      #    API gateway + rate limiting + security headers
│   ├── postgres/init-databases.sh
│   ├── docker-compose.yml    #    Healthchecks на всех контейнерах
│   └── .env.example          #    Документация всех env-переменных
│
├── .github/workflows/ci.yml  # ✅ CI/CD (все 7 сервисов + health polling)
└── README.md
```
