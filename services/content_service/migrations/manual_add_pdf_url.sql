-- Run once if content_db already existed before pdf_url column was added:
-- docker compose exec postgres psql -U postgres -d content_db -f - < migrations/manual_add_pdf_url.sql
ALTER TABLE materials ADD COLUMN IF NOT EXISTS pdf_url VARCHAR(500);
