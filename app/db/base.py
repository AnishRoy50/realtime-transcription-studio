from sqlalchemy.orm import declarative_base

Base = declarative_base()

# Import models here so Alembic can detect them
from app.models.session_model import TranscriptionSession  # noqa: E402, F401
