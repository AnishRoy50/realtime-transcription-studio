import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    PROJECT_NAME: str = "Real-Time Transcription API"
    API_V1_STR: str = "/api/v1"
    
    # Database
    DB_USER: str = os.getenv("DB_USER", "postgres")
    DB_PASSWORD: str = os.getenv("DB_PASSWORD", "password")
    DB_HOST: str = os.getenv("DB_HOST", "localhost")
    DB_PORT: str = os.getenv("DB_PORT", "5432")
    DB_NAME: str = os.getenv("DB_NAME", "transcription_db")
    
    # Construct DATABASE_URL if not provided
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    )

    # AI Model
    MODEL_PATH: str = os.getenv("MODEL_PATH", "model")
    
    # Vosk Model Settings
    DEFAULT_MODEL: str = "vosk-model-small-en-us-0.15"

    class Config:
        case_sensitive = True

settings = Settings()
