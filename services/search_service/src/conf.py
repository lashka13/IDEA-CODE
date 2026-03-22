from pydantic_settings import BaseSettings
from functools import lru_cache
import json


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@postgres:5432/search_db"
    SECRET_KEY: str = "super-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    KAFKA_BOOTSTRAP_SERVERS: str = "kafka:29092"
    CORS_ORIGINS: str = '["*"]'
    CONTENT_SERVICE_URL: str = "http://content_service:8000"
    AUTH_SERVICE_URL: str = "http://auth_service:8000"
    SEARCH_INDEX_SECRET: str = "search-service-internal"
    HUGGINGFACE_API_KEY: str = ""
    OPENROUTER_API_KEY: str = ""
    EMBEDDING_MODEL: str = "openai/text-embedding-3-small"
    LLM_MODEL: str = "google/gemma-3-4b-it:free"
    CHROMA_PERSIST_DIR: str = "/app/chroma_data"

    @property
    def cors_origins_list(self) -> list[str]:
        v = self.CORS_ORIGINS.strip()
        if v.startswith("["):
            return json.loads(v)
        return [o.strip() for o in v.split(",") if o.strip()]

    class Config:
        env_file = ".env"


@lru_cache
def get_settings() -> Settings:
    return Settings()
