import uuid

from sqlalchemy import Column, DateTime, Float, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from app.db.base import Base


class TranscriptionSession(Base):
    """
    ORM model representing a single transcription session.
    PostgreSQL-specific (UUID type from postgresql dialect).
    """

    __tablename__ = "transcription_sessions"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True,
    )

    started_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    audio_duration_seconds = Column(Float, nullable=False, default=0.0)
    final_transcript = Column(Text, nullable=False, default="")
    word_count = Column(Integer, nullable=False, default=0)
    model_used = Column(String(100), nullable=False)
    processing_time_seconds = Column(Float, nullable=False, default=0.0)

    sample_rate = Column(Integer, nullable=True)
    language_code = Column(String(16), nullable=True)
    status = Column(String(32), nullable=False, default="completed")
    error_message = Column(Text, nullable=True)
