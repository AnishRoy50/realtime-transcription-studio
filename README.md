# Real-Time Microphone Transcription System (CPU-Only)

A real-time speech-to-text application using FastAPI, WebSockets, and Vosk (CPU-friendly).

## Features
- Real-time transcription via WebSockets.
- CPU-only inference using Vosk.
- Session management with PostgreSQL.
- Dockerized deployment.

## Prerequisites
- Docker & Docker Compose
- Python 3.10+ (for local development)

## Quick Start (Docker)

1.  **Build and Run**:
    ```bash
    docker-compose up --build
    ```
    This will download the Vosk model (approx 40MB) during the build process.

2.  **Access the Frontend**:
    Open `frontend/index.html` in your browser.
    *Note*: You might need to serve it via a local server (e.g., `python -m http.server -d frontend 3000`) to access the microphone due to browser security policies, or access it via `localhost`.

3.  **API Documentation**:
    Go to `http://localhost:8000/docs` to see the Swagger UI.

## Local Development

1.  **Install Dependencies**:
    ```bash
    pip install -r requirements.txt
    ```

2.  **Download Model**:
    Download `vosk-model-small-en-us-0.15` from [Vosk Models](https://alphacephei.com/vosk/models) and extract it to a folder named `model` in the root directory.

3.  **Run Database**:
    Ensure PostgreSQL is running and update `.env` with credentials.

4.  **Run App**:
    ```bash
    uvicorn app.main:app --reload
    ```

## API Endpoints

- `GET /sessions`: List all transcription sessions.
- `GET /sessions/{id}`: Get details of a specific session.
- `WS /ws`: WebSocket endpoint for streaming audio.

## Architecture

- **Backend**: FastAPI handles HTTP and WebSocket connections.
- **Transcription**: `vosk` library processes audio chunks in real-time.
- **Database**: PostgreSQL stores session metadata and transcripts.
- **Frontend**: Simple HTML/JS client using Web Audio API.

