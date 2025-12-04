import pytest
from unittest.mock import MagicMock, patch
from app.services.transcription_service import TranscriptionService

def test_transcription_service_initialization():
    with patch("app.services.transcription_service.vosk.Model") as MockModel:
        with patch("app.services.transcription_service.os.path.exists", return_value=True):
            service = TranscriptionService()
            assert service.model is not None
            MockModel.assert_called_once()

def test_create_recognizer():
    with patch("app.services.transcription_service.vosk.Model") as MockModel:
        with patch("app.services.transcription_service.os.path.exists", return_value=True):
            service = TranscriptionService()
            
            with patch("app.services.transcription_service.vosk.KaldiRecognizer") as MockRecognizer:
                rec = service.create_recognizer(16000)
                assert rec is not None
                MockRecognizer.assert_called_once_with(service.model, 16000)
