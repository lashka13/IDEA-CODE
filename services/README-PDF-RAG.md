# PDF при создании материала → Smart Search / RAG

1. Пользователь загружает PDF через **«Добавить материал»** → файл уходит в `auth_service` (`POST /api/upload/`), в `content_service` сохраняется относительный путь `pdf_url` (например `/uploads/xxx.pdf`).

2. **`search_service`** при индексации материала скачивает PDF по внутреннему URL:
   - `AUTH_SERVICE_URL` + путь (по умолчанию `http://auth_service:8000` в Docker).
   - В **проде** задайте `AUTH_SERVICE_URL` на тот же хост/сервис, где отдаются `/uploads/` (внутренний DNS Kubernetes, service URL и т.д.).

3. Текст из PDF извлекается (`pypdf`) и **склеивается** с текстом уроков в один индексируемый документ.

4. **Существующая БД** без колонки: выполните  
   `content_service/migrations/manual_add_pdf_url.sql`  
   или пересоздайте volume PostgreSQL.
