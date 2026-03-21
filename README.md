# IT-RE:SOURCE

Образовательная платформа-маркетплейс IT-материалов с внутренней валютой CodeCoins.

## Стек

**Frontend:** React 19, TypeScript, Redux Toolkit, Tailwind CSS, Framer Motion, Vite

**Backend:** FastAPI, SQLAlchemy (async), PostgreSQL, JWT, WebSocket

## Архитектура

```
frontend/          React SPA (Feature Sliced Design)
  src/
    app/           Провайдеры, роутинг, стор
    pages/         17 страниц
    features/      Auth, покупка, фильтры, поиск, прогресс курсов
    entities/      Material, User, Community, Transaction, Achievement, Post
    shared/        UI-компоненты, API-клиент, типы, утилиты
    widgets/       Header, Footer

api/               FastAPI backend
  models/          12 SQLAlchemy моделей
  schemas/         Pydantic-схемы
  routers/         12 роутеров (40+ эндпоинтов)
  services/        Auth (JWT + bcrypt), CodeCoins
  alembic/         Миграции БД
  seed.py          Начальные данные
```

## Возможности

- **Каталог материалов** — фильтры по языку, сложности, формату, типу задачи; сортировка; поиск
- **Система CodeCoins** — покупка/продажа материалов, роялти, награды, история транзакций
- **Курсы с уроками** — видео, текст, код, квизы; отслеживание прогресса
- **Сообщества** — 7 IT-кластеров (Frontend, Backend, DevOps, Data Science, CyberSec, Mobile, GameDev)
- **Чат** — каналы, сообщения, реакции, ответы; WebSocket для реального времени
- **Профили** — рейтинг, радар навыков, стек технологий, уровни
- **Геймификация** — ачивки (common/rare/epic/legendary), рейтинги авторов
- **Челленджи** — задачи с примерами кода и тест-кейсами, IDE в браузере
- **Roadmap** — визуальная карта обучения (React Flow)
- **Расписание** — стримы, вебинары, воркшопы
- **Менторы** — профили менторов с бронированием
- **Проекты** — командные проекты с ролями

## Запуск

### Микросервисы (актуально: Smart Search, RAG, материалы)

```bash
cd services
docker compose up -d --build   # шлюз nginx на http://localhost:8000
```

Фронт в dev (`npm run dev` → :5173): в `frontend/.env.development` задано `VITE_API_BASE=http://localhost:8000/api`, чтобы логин шёл в шлюз. **Не** поднимайте один сервис (например только search) на порт 8000 — нужен **nginx** из `services/docker-compose.yml`.

Если видите `404` на `/api/auth/login` — проверьте, что шлюз запущен и в `VITE_API_BASE` есть суффикс **`/api`**.

### Backend (монолит `api/`, другой compose)

```bash
cd api
docker compose up -d        # PostgreSQL + API на :8001
```

Заполнить БД тестовыми данными:

```bash
# внутри контейнера
docker compose exec api python seed.py
```

### Frontend

```bash
cd frontend
npm install
npm run dev                 # http://localhost:5173
```

Для монолита Vite проксирует `/api` на `localhost:8001`. Для микросервисов см. `VITE_API_BASE` выше.

## Тестовые аккаунты

Все пользователи доступны с паролем `password123`:

| Имя | Username | Стек | Уровень |
|-----|----------|------|---------|
| Алексей Петров | alexdev | React, TypeScript, Go | Эксперт (12) |
| Мария Козлова | mashka_ds | Python, Pandas, TensorFlow | Продвинутый (9) |
| Дмитрий Волков | dima_devops | Docker, K8s, CI/CD | Гуру (15) |
| Анна Сидорова | anna_mobile | Kotlin, Flutter, Dart | Новичок (5) |

## API

Документация доступна по адресу `http://localhost:8001/docs` (Swagger UI).

Основные группы эндпоинтов:

- `POST /api/auth/register` | `POST /api/auth/login` | `GET /api/auth/me`
- `GET /api/materials/` | `POST /api/materials/` | `POST /api/materials/{id}/purchase`
- `GET /api/communities/` | `POST /api/communities/{slug}/join`
- `GET /api/transactions/` | `GET /api/achievements/`
- `GET /api/chat/channels` | `WS /api/ws/chat/{channel_id}`
- `POST /api/upload/`

## Переменные окружения

```env
DATABASE_URL=postgresql+asyncpg://postgres:postgres@db:5432/ideacode
SECRET_KEY=super-secret-key-change-in-production
```
