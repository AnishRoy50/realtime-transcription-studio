from uuid import UUID
from sqlalchemy.orm import Session
from typing import List, Optional
from app.models.session_model import TranscriptionSession
from app.schemas.session_schema import TranscriptionSessionBase

class SessionService:
    def create_session(self, db: Session, model_used: str, sample_rate: int, language_code: str) -> TranscriptionSession:
        db_session = TranscriptionSession(
            model_used=model_used,
            sample_rate=sample_rate,
            language_code=language_code,
            status="processing"
        )
        db.add(db_session)
        db.commit()
        db.refresh(db_session)
        return db_session

    def get_session(self, db: Session, session_id: UUID) -> Optional[TranscriptionSession]:
        return db.query(TranscriptionSession).filter(TranscriptionSession.id == session_id).first()

    def get_all_sessions(self, db: Session, skip: int = 0, limit: int = 100) -> List[TranscriptionSession]:
        return db.query(TranscriptionSession).order_by(TranscriptionSession.started_at.desc()).offset(skip).limit(limit).all()

    def update_session(self, db: Session, session_id: UUID, transcript: str, word_count: int, duration: float, status: str = "completed", error: str = None) -> Optional[TranscriptionSession]:
        db_session = self.get_session(db, session_id)
        if db_session:
            db_session.final_transcript = transcript
            db_session.word_count = word_count
            db_session.audio_duration_seconds = duration
            db_session.status = status
            db_session.error_message = error
            db.commit()
            db.refresh(db_session)
        return db_session

session_service = SessionService()
