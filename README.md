# Transcription Studio🎙️

**Transcription Studio** is a full-stack, real-time speech-to-text application designed to run entirely on local CPUs. It leverages the **Vosk** engine for ultra-low latency, offline transcription, providing a privacy-focused alternative to cloud-based services.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/python-3.10%2B-blue)
![Next.js](https://img.shields.io/badge/next.js-14-black)
![Docker](https://img.shields.io/badge/docker-ready-blue)

## 🌐 Live Demo

- **Frontend Application**: [https://realtime-transcription-studio.vercel.app/](https://realtime-transcription-studio.vercel.app/)
- **Backend API Docs**: [https://realtime-transcription-studio.onrender.com/docs](https://realtime-transcription-studio.onrender.com/docs)

> **Note:** The backend is hosted on a free tier service (Render), so it may spin down after inactivity. Please allow a minute for the first request to wake it up.

## 🚀 Features

- **Real-Time Transcription**: Instant speech-to-text using WebSocket streaming with near-zero latency.
- **Offline & Private**: Powered by **Vosk**, running entirely locally. No audio data leaves your machine.
- **Session History**: Automatically saves transcripts, duration, and word counts to a PostgreSQL database.
- **Audio Visualization**: Real-time frequency analysis visualizer in the frontend.
- **Responsive UI**: Modern, dark-themed interface built with Next.js and Tailwind CSS.
- **CPU Optimized**: Lightweight model designed to run smoothly on standard consumer hardware (no GPU required).

---

## 🛠️ Architecture & Design

### System Overview
The system follows a client-server architecture:

1.  **Frontend (Next.js)**: Captures microphone audio using the Web Audio API, converts it to 16-bit PCM (16kHz), and streams it via WebSocket.
2.  **Backend (FastAPI)**: Receives audio streams and processes them in real-time using the Vosk engine.
3.  **Transcription Engine**: **Vosk** (Kaldi-based) processes audio frame-by-frame for immediate feedback.
4.  **Database (PostgreSQL)**: Stores session metadata and final transcripts for historical retrieval.

### Design Decisions
- **Vosk for Latency**: We chose Vosk over Transformer-based models (like Whisper) for this iteration to prioritize *speed*. Vosk provides true streaming capabilities, outputting words the moment they are spoken.
- **Direct Streaming**: The WebSocket handler feeds raw audio bytes directly to the recognizer without the need for large buffers, ensuring minimal delay.
- **Containerization**: The entire stack is dockerized for consistent deployment across environments.

---

## 📦 Installation & Execution

### Option 1: Docker (Recommended)
The easiest way to run the application is using Docker Compose.

**Prerequisites:**
- Docker Desktop installed and running.

1.  **Clone the repository:**
    ```bash
    https://github.com/AnishRoy50/realtime-transcription-studio.git

    cd realtime-transcription-studio
    ```

2.  **Start the services:**
    ```bash
    docker-compose up --build
    ```

3.  **Access the application:**
    - Frontend: [http://localhost:3000](http://localhost:3000)
    - Backend API Docs: [http://localhost:8000/docs](http://localhost:8000/docs)


### Option 2: Manual Setup (Local Development)

**Prerequisites:**
- Python 3.10+
- Node.js 18+
- PostgreSQL running locally

#### 1. **Backend Setup**

Step 1: Environment Setup
```bash
# Navigate to root
cd realtime-transcription-studio

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate  
# On Windows:
.\venv\Scripts\Activate
```
Step 2: Download Model

Download a lightweight English model (e.g., vosk-model-small-en-us-0.15) from the Vosk Models page.

Extract the contents into a folder named model in the root directory.

Structure Check:
```
realtime-transcription-studio/
├── model/
│   ├── am/
│   ├── conf/
│   └── ...
├── app/
└── frontend/
```
Step 3: Install & Configure

```bash
# Install dependencies
pip install -r requirements.txt

# Configure Environment
# Create a .env file or ensure your local Postgres matches config.py defaults:
# DB_USER=postgres, DB_PASSWORD=password, DB_NAME=transcription_db

# Run Migrations
alembic upgrade head

# Start Server
uvicorn app.main:app --reload
```
### 2. **Frontend Setup**
```bash
# Open new terminal
cd frontend

# Install dependencies
npm install

# Start Dev Server
npm run dev
```

## 📡 API Usage Examples

The backend provides a REST API for session management and a WebSocket endpoint for streaming.

### 1. Get All Sessions
Retrieve a list of past transcription sessions.

**Request:**
```bash
curl -X 'GET' \
  'http://localhost:8000/api/v1/sessions/?skip=0&limit=10' \
  -H 'accept: application/json'
```

**Response:**
```json
[
  {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "started_at": "2025-12-04T10:00:00Z",
    "audio_duration_seconds": 45.5,
    "final_transcript": "hello world this is a test",
    "word_count": 6,
    "model_used": "vosk-model-small-en-us-0.15",
    "processing_time_seconds": 0.5
  }
]
```

### 2. Get Session Details
Retrieve full details for a specific session.

**Request:**
```bash
curl -X 'GET' \
  'http://localhost:8000/api/v1/sessions/3fa85f64-5717-4562-b3fc-2c963f66afa6' \
  -H 'accept: application/json'
```

### 3. WebSocket Streaming
- **Endpoint**: `ws://localhost:8000/ws`
- **Protocol**: Send raw binary audio data (16kHz, 16-bit mono PCM).
- **Response**: JSON messages.
    - `{"type": "partial", "text": "hello w..."}` (Real-time updates)
    - `{"type": "final", "text": "hello world"}` (Confirmed sentence)

---

## 🗄️ Database Schema

The application uses a single primary table `transcription_sessions` in PostgreSQL.

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Unique identifier for the session. |
| `started_at` | DateTime | Timestamp when recording started. |
| `audio_duration_seconds` | Float | Total duration of the recorded audio. |
| `final_transcript` | Text | The complete transcribed text. |
| `word_count` | Integer | Total number of words in the transcript. |
| `model_used` | String | Name of the AI model used. |
| `status` | String | Status of the session (e.g., "completed", "error"). |

---

## ⚠️ Limitations & Future Improvements

### Notable Limitations
1.  **Accuracy**: The lightweight Vosk model is less accurate than large Transformer models (like Whisper), especially with accents or background noise.
2.  **Formatting**: Vosk output is typically lowercase and lacks punctuation (periods, commas) by default.
3.  **Single Speaker**: The current implementation does not distinguish between different speakers (diarization).

### Suggested Improvements
- [ ] **Model Upgrade**: Switch to a larger Vosk model for better accuracy (requires more RAM).
- [ ] **Punctuation Model**: Integrate a separate punctuation restoration model (e.g., DeepMultilingualPunctuation) to format the output.
- [ ] **Hybrid Approach**: Use Vosk for real-time display and Whisper for a high-quality final transcript after the session ends.

---

## 📄 License

This project is licensed under the MIT License.

