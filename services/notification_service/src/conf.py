from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@postgres:5432/notification_db"
    SECRET_KEY: str = "super-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    KAFKA_BOOTSTRAP_SERVERS: str = "kafka:29092"
    REDIS_URL: str = "redis://redis:6379/4"
    CORS_ORIGINS: list[str] = ["*"]

    class Config:
        env_file = ".env"


@lru_cache
def get_settings() -> Settings:
    return Settings()
