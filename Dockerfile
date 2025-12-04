FROM python:3.10-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    wget \
    unzip \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Download Vosk Model
RUN mkdir -p /app/model && \
    wget https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip && \
    unzip vosk-model-small-en-us-0.15.zip && \
    mv vosk-model-small-en-us-0.15/* /app/model/ && \
    rm vosk-model-small-en-us-0.15.zip && \
    rm -rf vosk-model-small-en-us-0.15

# Copy application code
COPY . .

# Environment for app
ENV PYTHONUNBUFFERED=1
ENV VOSK_MODEL_PATH=/app/model

# Expose port
EXPOSE 8000

# Run the application (with migrations)
CMD alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8000
