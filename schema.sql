-- PostgreSQL-specific schema

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS transcription_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    audio_duration_seconds DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    final_transcript TEXT NOT NULL DEFAULT '',
    word_count INTEGER NOT NULL DEFAULT 0,
    model_used VARCHAR(100) NOT NULL,
    processing_time_seconds DOUBLE PRECISION NOT NULL DEFAULT 0.0,

    sample_rate INTEGER,
    language_code VARCHAR(16),
    status VARCHAR(32) NOT NULL DEFAULT 'completed',
    error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_transcription_sessions_started_at
    ON transcription_sessions (started_at DESC);
