from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@postgres:5432/search_db"
    SECRET_KEY: str = "super-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    KAFKA_BOOTSTRAP_SERVERS: str = "kafka:29092"
    CORS_ORIGINS: list[str] = ["*"]
    CONTENT_SERVICE_URL: str = "http://content_service:8000"
    AUTH_SERVICE_URL: str = "http://auth_service:8000"
    SEARCH_INDEX_SECRET: str = "search-service-internal"
    HUGGINGFACE_API_KEY: str = ""
    OPENROUTER_API_KEY: str = ""
    EMBEDDING_MODEL: str = "openai/text-embedding-3-small"
    LLM_MODEL: str = "google/gemma-2-9b-it:free"
    CHROMA_PERSIST_DIR: str = "/app/chroma_data"

    class Config:
        env_file = ".env"


@lru_cache
def get_settings() -> Settings:
    return Settings()
