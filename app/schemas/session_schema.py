from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class TranscriptionSessionBase(BaseModel):
    id: UUID
    started_at: datetime

    audio_duration_seconds: float
    final_transcript: str
    word_count: int
    model_used: str
    processing_time_seconds: float


class TranscriptionSessionListItem(TranscriptionSessionBase):
    class Config:
        orm_mode = True


class TranscriptionSessionDetail(TranscriptionSessionBase):
    sample_rate: int | None = None
    language_code: str | None = None
    status: str
    error_message: str | None = None

    class Config:
        orm_mode = True
