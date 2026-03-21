from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@postgres:5432/transaction_db"
    SECRET_KEY: str = "super-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    KAFKA_BOOTSTRAP_SERVERS: str = "kafka:29092"
    REDIS_URL: str = "redis://redis:6379/3"
    AUTH_SERVICE_URL: str = "http://auth_service:8000"

    class Config:
        env_file = ".env"


@lru_cache
def get_settings() -> Settings:
    return Settings()
