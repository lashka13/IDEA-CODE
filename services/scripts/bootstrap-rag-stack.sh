#!/usr/bin/env bash
# Заполняет БД сидами и перезапускает search_service, чтобы подтянуть материалы в индекс RAG.
# Запуск из каталога services/:  ./scripts/bootstrap-rag-stack.sh
set -euo pipefail
cd "$(dirname "$0")/.."

echo "==> auth_service seed (пользователи для логина и авторов)"
docker compose exec -T auth_service python seed.py

echo "==> auth_service seed_mentors (страница /mentors)"
docker compose exec -T auth_service python seed_mentors.py

echo "==> content_service seed (материалы + уроки для индекса)"
docker compose exec -T content_service python seed.py

echo "==> community_service seed (сообщества)"
docker compose exec -T community_service python seed.py

echo "==> community_service seed_projects (проекты)"
docker compose exec -T community_service python seed_projects.py

echo "==> chat_service seed (каналы)"
docker compose exec -T chat_service python seed.py

echo "==> Перезапуск search_service (повторный sync из content_service + Chroma/BM25)"
docker compose restart search_service

echo "==> Ждём health search_service (до 90 c)…"
for i in $(seq 1 18); do
  if docker compose exec -T search_service python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/health')" 2>/dev/null; then
    echo "OK search_service healthy"
    break
  fi
  sleep 5
  if [ "$i" -eq 18 ]; then
    echo "WARN: search_service ещё не отвечает — смотри: docker compose logs search_service --tail 50"
    exit 1
  fi
done

echo ""
echo "Проверка с хоста (шлюз nginx на :8000):"
echo "  curl -s \"http://localhost:8000/api/search/?q=React&top_k=3\" | head -c 400"
echo ""
echo "RAG в UI: http://localhost:8000/smart-search — войди (password123), открой «Чат с AI»."
echo "Нужны OPENROUTER_API_KEY и (желательно) кредиты для embeddings в services/.env"
