# Микросервисы (Docker Compose)

## Запуск

```bash
cd services
docker compose up -d --build
```

Открывайте приложение только через **шлюз nginx**: **http://localhost:8000**

### Порты и авторизация (важно)

| Как открываете UI | Куда уходит `POST /api/auth/login` | Ожидание |
|-------------------|-------------------------------------|----------|
| **http://localhost:8000** | Тот же хост → шлюз `nginx` → `auth_service` | Работает |
| **http://localhost:5173** (`npm run dev`) | Vite проксирует `/api` → `localhost:8000` | Шлюз на 8000 должен быть запущен |
| Порт, проброшенный **только** на контейнер `frontend` | Раньше давало **404** на `/api` (SPA). Сейчас во `frontend/nginx.conf` `/api` проксируется на сервис `nginx` | После `docker compose up --build` должно работать |
| Отладка **auth** изнутри сети | `docker compose exec auth_service curl -s -o /dev/null -w "%{http_code}" -X POST http://127.0.0.1:8000/api/auth/login -H "Content-Type: application/json" -d '{"username":"alexdev","password":"password123"}'` | **200** если seed выполнен |

Проверка шлюза с хоста:

```bash
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"alexdev","password":"password123"}'
```

Ожидается **200**. **404** — запрос не доходит до FastAPI `auth_service` (не тот порт / не тот compose).

Если при **`npm run dev`** всё ещё 404 — создайте `frontend/.env.development`:

```env
VITE_API_BASE=http://localhost:8000/api
```

## Вход (логин)

1. Создайте пользователей в БД (один раз):

   ```bash
   docker compose exec auth_service python seed.py
   ```

2. Пароль у тестовых пользователей: **`password123`** (логины: `alexdev`, `mashka_ds`, `dima_devops`, `anna_mobile`).

3. Страница входа: **http://localhost:8000/login**

### Ошибка «Not Found» при входе

Это обычно **HTTP 404** от API (`{"detail":"Not Found"}`). Частые причины:

| Причина | Что сделать |
|--------|-------------|
| Открыт не тот порт | Используйте **:8000** (nginx), не отдельный контейнер, проброшенный на 8000. |
| Проброшен только `search_service` на 8000 | Запросы к `/api/auth/*` попадут не в `auth_service` → 404. Поднимайте весь стек с **nginx**. |
| `npm run dev` (Vite) | В `vite.config.ts` прокси `/api` → `http://localhost:8000`; шлюз должен быть запущен. |

Проверка с хоста:

```bash
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"alexdev","password":"password123"}'
```

Ожидается **200**. Если **404** — запрос не доходит до `auth_service` через nginx.

---

## Smart Search (поиск + RAG)

- Индексируются **только материалы каталога** (`content_service`): при старте `search_service` подтягивает все материалы + уроки (заголовок `X-Search-Index` = общий секрет с `content_service`).
- **Автообновление:** Kafka-топики `material.created`, `material.updated`, `material.deleted` — переиндексация при создании/изменении материала или уроков, удаление из поиска при удалении материала.
- Отдельная загрузка PDF в поиск **отключена** — добавляйте материалы через UI **`/add-material`**.

Переменная **`SEARCH_INDEX_SECRET`** (одинаковая в `content_service` и `search_service`) задаётся в `docker-compose` / `.env`.

---

## Run (English)

- Use **`http://localhost:8000`** (nginx gateway) only.
- Seed users: `docker compose exec auth_service python seed.py`, password **`password123`**.
- If login returns **404 Not Found**, you are not hitting **`auth_service`** through nginx (wrong port / wrong compose / mapping only one service to 8000).

### Smart Search

- Index = **catalog materials only** (`content_service`), synced on startup + Kafka (`material.created` / `material.updated` / `material.deleted`).
- Shared **`SEARCH_INDEX_SECRET`** lets `search_service` fetch **full lesson bodies** for indexing (not public-user preview).
- No separate PDF upload to search — use **`/add-material`** for new content.
