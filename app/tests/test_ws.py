from unittest.mock import patch, MagicMock

def test_websocket_connection(client):
    # Mock the transcription service to avoid actual model calls
    with patch("app.api.routers.websocket.transcription_service") as mock_service:
        # Mock the recognizer
        mock_rec = MagicMock()
        mock_service.create_recognizer.return_value = mock_rec
        
        # Mock AcceptWaveform to return False (partial) then True (final)
        mock_rec.AcceptWaveform.side_effect = [False, True]
        mock_rec.PartialResult.return_value = '{"partial": "hello"}'
        mock_rec.Result.return_value = '{"text": "hello world"}'
        mock_rec.FinalResult.return_value = '{"text": ""}'

        with client.websocket_connect("/ws") as websocket:
            # Send some dummy audio bytes
            websocket.send_bytes(b"dummy_audio_data")
            
            # Expect partial result
            data = websocket.receive_json()
            assert data == {"type": "partial", "text": "hello"}
            
            # Send more bytes to trigger "final"
            websocket.send_bytes(b"more_audio")
            data = websocket.receive_json()
            assert data == {"type": "final", "text": "hello world"}
            
            websocket.close()

