from pydantic_settings import BaseSettings
from functools import lru_cache
import json


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@postgres:5432/content_db"
    SECRET_KEY: str = "super-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    KAFKA_BOOTSTRAP_SERVERS: str = "kafka:29092"
    REDIS_URL: str = "redis://redis:6379/1"
    CORS_ORIGINS: str = '["*"]'
    AUTH_SERVICE_URL: str = "http://auth_service:8000"
    SEARCH_INDEX_SECRET: str = "search-service-internal"

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
