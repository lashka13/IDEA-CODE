from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@postgres:5432/search_db"
    SECRET_KEY: str = "super-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    KAFKA_BOOTSTRAP_SERVERS: str = "kafka:29092"
    CONTENT_SERVICE_URL: str = "http://content_service:8000"
    # Fetch uploaded PDFs for material indexing (Docker network or internal URL in prod).
    AUTH_SERVICE_URL: str = "http://auth_service:8000"
    # Must match content_service SEARCH_INDEX_SECRET (full lesson text for indexing).
    SEARCH_INDEX_SECRET: str = "search-service-internal"
    HUGGINGFACE_API_KEY: str = ""
    OPENROUTER_API_KEY: str = ""
    # OpenRouter embedding model id (see https://openrouter.ai/models?fmt=cards&input_modalities=text)
    EMBEDDING_MODEL: str = "openai/text-embedding-3-small"
    LLM_MODEL: str = "google/gemma-2-9b-it:free"
    CHROMA_PERSIST_DIR: str = "/app/chroma_data"

    class Config:
        env_file = ".env"


@lru_cache
def get_settings() -> Settings:
    return Settings()
