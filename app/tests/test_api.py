def test_read_root(client):
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Real-Time Transcription API is running"}

def test_read_sessions_empty(client):
    response = client.get("/api/v1/sessions/")
    assert response.status_code == 200
    assert response.json() == []


