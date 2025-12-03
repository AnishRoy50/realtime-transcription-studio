from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.orm import Session
import json
import time
from app.db.session import get_db
from app.services.transcription_service import transcription_service
from app.services.session_service import session_service
from app.core.config import settings

router = APIRouter()

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, db: Session = Depends(get_db)):
    await websocket.accept()
    
    # Initial handshake or config could go here
    # For now, assume 16kHz mono
    SAMPLE_RATE = 16000
    
    try:
        rec = transcription_service.create_recognizer(SAMPLE_RATE)
    except RuntimeError as e:
        await websocket.close(code=1011, reason=str(e))
        return

    # Create DB session
    db_session = session_service.create_session(
        db=db,
        model_used=settings.DEFAULT_MODEL if hasattr(settings, 'DEFAULT_MODEL') else "vosk-model",
        sample_rate=SAMPLE_RATE,
        language_code="en"
    )
    
    start_time = time.time()
    full_transcript = ""
    
    try:
        while True:
            data = await websocket.receive_bytes()
            
            if rec.AcceptWaveform(data):
                result = json.loads(rec.Result())
                text = result.get("text", "")
                if text:
                    full_transcript += text + " "
                    await websocket.send_json({"type": "final", "text": text})
            else:
                partial = json.loads(rec.PartialResult())
                await websocket.send_json({"type": "partial", "text": partial.get("partial", "")})
                
    except WebSocketDisconnect:
        pass
    except Exception as e:
        print(f"Error: {e}")
    finally:
        # Finalize
        final_res = json.loads(rec.FinalResult())
        final_text = final_res.get("text", "")
        if final_text:
            full_transcript += final_text
            
        duration = time.time() - start_time
        word_count = len(full_transcript.split())
        
        session_service.update_session(
            db=db,
            session_id=db_session.id,
            transcript=full_transcript.strip(),
            word_count=word_count,
            duration=duration,
            status="completed"
        )

