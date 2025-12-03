from functools import lru_cache

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Raw PostgreSQL pieces (mostly for reference / future use)
    DB_USER: str = "postgres"
    DB_PASSWORD: str = "postgres"
    DB_HOST: str = "localhost"
    DB_PORT: int = 5432
    DB_NAME: str = "transcription_db"

    # Full SQLAlchemy PostgreSQL URL
    # Example: postgresql+psycopg2://user:password@host:port/db_name
    DATABASE_URL: str

    APP_ENV: str = "development"
    LOG_LEVEL: str = "INFO"

    DEFAULT_MODEL: str = "vosk-small-en"
    DEFAULT_LANGUAGE: str = "en"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
