from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@db:5432/ideacode"
    SECRET_KEY: str = "super-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    UPLOAD_DIR: str = "uploads"
    MAX_UPLOAD_SIZE: int = 10 * 1024 * 1024  # 10MB
    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:3000"]
    REGISTRATION_BONUS: int = 50

    # AI Search & RAG settings
    OPENROUTER_API_KEY: str = ""
    OPENROUTER_MODEL: str = "nvidia/nemotron-3-nano-30b-a3b:free"
    CHROMA_DB_PATH: str = "./chroma_db"
    EMBEDDING_MODEL: str = "paraphrase-multilingual-MiniLM-L12-v2"
    # HuggingFace Inference API token — instant embeddings via API, no local download
    # Get free token at: https://huggingface.co/settings/tokens
    HF_API_TOKEN: str = ""
    # Fallback: load model locally (slow first run, ~470 MB download)
    USE_LOCAL_EMBEDDINGS: bool = True

    class Config:
        env_file = ".env"


@lru_cache
def get_settings() -> Settings:
    return Settings()
