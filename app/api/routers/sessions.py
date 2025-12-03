from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.db.session import get_db
from app.services.session_service import session_service
from app.schemas.session_schema import TranscriptionSessionListItem, TranscriptionSessionDetail

router = APIRouter()

@router.get("/", response_model=List[TranscriptionSessionListItem])
def read_sessions(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    sessions = session_service.get_all_sessions(db, skip=skip, limit=limit)
    return sessions

@router.get("/{session_id}", response_model=TranscriptionSessionDetail)
def read_session(session_id: UUID, db: Session = Depends(get_db)):
    db_session = session_service.get_session(db, session_id=session_id)
    if db_session is None:
        raise HTTPException(status_code=404, detail="Session not found")
    return db_session
