"""create transcription_sessions table

Revision ID: 20251203_01
Revises: None
Create Date: 2025-12-03 00:00:00
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "20251203_01"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";')

    op.create_table(
        "transcription_sessions",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("uuid_generate_v4()"),
        ),
        sa.Column(
            "started_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
        sa.Column("audio_duration_seconds", sa.Float, nullable=False, server_default="0.0"),
        sa.Column("final_transcript", sa.Text, nullable=False, server_default=""),
        sa.Column("word_count", sa.Integer, nullable=False, server_default="0"),
        sa.Column("model_used", sa.String(length=100), nullable=False),
        sa.Column("processing_time_seconds", sa.Float, nullable=False, server_default="0.0"),
        sa.Column("sample_rate", sa.Integer, nullable=True),
        sa.Column("language_code", sa.String(length=16), nullable=True),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="completed"),
        sa.Column("error_message", sa.Text, nullable=True),
    )

    op.create_index(
        "idx_transcription_sessions_started_at",
        "transcription_sessions",
        ["started_at"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("idx_transcription_sessions_started_at", table_name="transcription_sessions")
    op.drop_table("transcription_sessions")
