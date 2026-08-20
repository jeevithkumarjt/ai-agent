"""Add sessions table for refresh token revocation.

Enables revoking user access by invalidating active sessions.
The /v1/auth/refresh endpoint checks the sessions table before issuing
a new access token, so revoked tokens are immediately invalidated.
"""

from __future__ import annotations

import uuid

from alembic import op
from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Index,
    String,
    UUID,
)
from sqlalchemy.dialects import postgresql

revision = "0004"
down_revision = "0003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "sessions",
        Column("id", postgresql.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        Column("user_id", postgresql.UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        Column("sid", String, nullable=False),  # session ID embedded in refresh token
        Column("created_at", DateTime(timezone=True), server_default="now()", nullable=False),
        Column("expires_at", DateTime(timezone=True), nullable=False),
        Index("ix_sessions_user_id", "user_id"),
        Index("ix_sessions_sid", "sid"),
    )


def downgrade() -> None:
    op.drop_table("sessions")