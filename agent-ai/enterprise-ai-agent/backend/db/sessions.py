"""Sessions model for refresh token revocation tracking.

Tracks active sessions identified by `sid` embedded in refresh tokens.
When a user's access is revoked, their session record is deleted or
expired, causing subsequent `/v1/auth/refresh` calls to fail immediately.
"""
from __future__ import annotations

import uuid

from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    MetaData,
    String,
    Table,
    UUID,
)


metadata = MetaData()

sessions = Table(
    "sessions",
    metadata,
    Column("id", UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
    Column("user_id", UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
    Column("sid", String, nullable=False),  # session ID embedded in refresh token
    Column("created_at", DateTime(timezone=True), server_default="now()", nullable=False),
    Column("expires_at", DateTime(timezone=True), nullable=False),
    Index("ix_sessions_user_id", "user_id"),
    Index("ix_sessions_sid", "sid"),
)