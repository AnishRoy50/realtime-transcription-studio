from typing import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session

from app.core.config import settings


SQLALCHEMY_DATABASE_URL = settings.DATABASE_URL  # PostgreSQL URL

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    future=True,
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    future=True,
)


def get_db() -> Generator[Session, None, None]:
    """
    Dependency-style DB session (to be used in FastAPI endpoints later).
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
