import json
import os
import vosk
from app.core.config import settings

class TranscriptionService:
    def __init__(self):
        self.model = None
        if not os.path.exists(settings.MODEL_PATH):
            print(f"Model not found at {settings.MODEL_PATH}. Please download a model from https://alphacephei.com/vosk/models")
        else:
            try:
                self.model = vosk.Model(settings.MODEL_PATH)
                print(f"Vosk model loaded from {settings.MODEL_PATH}")
            except Exception as e:
                print(f"Failed to load model: {e}")

    def create_recognizer(self, sample_rate: int):
        if not self.model:
            raise RuntimeError("Vosk model is not loaded.")
        return vosk.KaldiRecognizer(self.model, sample_rate)

transcription_service = TranscriptionService()
