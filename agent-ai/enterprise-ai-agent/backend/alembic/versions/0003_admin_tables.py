"""Bring admin tables under Alembic versioning.

Creates all admin portal tables (admin_documents, admin_document_versions,
unanswered_questions, answer_metrics, audit_logs, notifications, admin_settings,
train_jobs, message_feedback) via a single migration so they are tracked
in alembic's version history and have a proper rollback path.

This replaces the previous `AdminBase.metadata.create_all` at startup which
had no rollback path and no schema history.
"""

from __future__ import annotations

import uuid

from alembic import op
from sqlalchemy import (
    BigInteger,
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID

revision = "0003"
down_revision = "0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # --- admin_documents ---
    op.create_table(
        "admin_documents",
        Column("id", UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        Column("tenant_id", UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False),
        Column("name", Text, nullable=False),
        Column("path", Text, nullable=False),
        Column("kind", Text, nullable=False, default="file"),
        Column("ext", Text, nullable=False, default=""),
        Column("size_bytes", BigInteger, nullable=False, default=0),
        Column("checksum", Text, nullable=False, default=""),
        Column("version", Integer, nullable=False, default=1),
        Column("title", Text, nullable=False, default=""),
        Column("content_text", Text, nullable=False, default=""),
        Column("meta", JSONB, nullable=False, default=dict),
        Column("status", Text, nullable=False, default="draft"),
        Column("error", Text, nullable=False, default=""),
        Column("created_by", UUID(as_uuid=True), nullable=True),
        Column("created_at", DateTime(timezone=True), server_default=func.now(), nullable=False),
        Column("updated_at", DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False),
        Column("last_indexed_at", DateTime(timezone=True), nullable=True),
        UniqueConstraint("tenant_id", "path", name="uq_admin_docs_path"),
        Index("idx_admin_docs_tenant", "tenant_id"),
        Index("idx_admin_docs_status", "tenant_id", "status"),
        Index("idx_admin_docs_checksum", "tenant_id", "checksum"),
    )

    # --- admin_document_versions ---
    op.create_table(
        "admin_document_versions",
        Column("id", UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        Column("tenant_id", UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False),
        Column("document_id", UUID(as_uuid=True), ForeignKey("admin_documents.id", ondelete="CASCADE"), nullable=False),
        Column("version", Integer, nullable=False),
        Column("checksum", Text, nullable=False, default=""),
        Column("content_text", Text, nullable=False, default=""),
        Column("reason", Text, nullable=False, default=""),
        Column("created_by", UUID(as_uuid=True), nullable=True),
        Column("created_at", DateTime(timezone=True), server_default=func.now(), nullable=True),
        Index("idx_admin_ver_doc", "tenant_id", "document_id"),
        UniqueConstraint("document_id", "version", name="uq_admin_ver_doc_version"),
    )

    # --- unanswered_questions ---
    op.create_table(
        "unanswered_questions",
        Column("id", UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        Column("tenant_id", UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False),
        Column("question", Text, nullable=False),
        Column("conversation_id", UUID(as_uuid=True), nullable=True),
        Column("source", Text, nullable=False, default="auto"),
        Column("status", Text, nullable=False, default="new"),
        Column("answer", Text, nullable=False, default=""),
        Column("confidence", Float, nullable=False, default=0.0),
        Column("answer_by", UUID(as_uuid=True), nullable=True),
        Column("answer_at", DateTime(timezone=True), nullable=True),
        Column("created_at", DateTime(timezone=True), server_default=func.now(), nullable=False),
        Column("updated_at", DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False),
        Index("idx_uq_tenant", "tenant_id"),
        Index("idx_uq_status", "tenant_id", "status"),
    )

    # --- answer_metrics ---
    op.create_table(
        "answer_metrics",
        Column("id", UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        Column("tenant_id", UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False),
        Column("conversation_id", UUID(as_uuid=True), nullable=True),
        Column("message_id", UUID(as_uuid=True), nullable=True),
        Column("question", Text, nullable=False, default=""),
        Column("answer_length", Integer, nullable=False, default=0),
        Column("response_time_ms", BigInteger, nullable=False, default=0),
        Column("tool_calls", Integer, nullable=False, default=0),
        Column("answered", Boolean, nullable=False, default=True),
        Column("confidence", Float, nullable=False, default=0.0),
        Column("created_at", DateTime(timezone=True), server_default=func.now(), nullable=False),
        Index("idx_am_tenant", "tenant_id"),
        Index("idx_am_tenant_created", "tenant_id", "created_at"),
    )

    # --- audit_logs ---
    op.create_table(
        "audit_logs",
        Column("id", UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        Column("tenant_id", UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False),
        Column("user_id", UUID(as_uuid=True), nullable=True),
        Column("email", Text, nullable=False, default=""),
        Column("role", Text, nullable=False, default=""),
        Column("action", Text, nullable=False),
        Column("target_type", Text, nullable=False, default=""),
        Column("target_id", Text, nullable=False, default=""),
        Column("detail", JSONB, nullable=False, default=dict),
        Column("ip", Text, nullable=False, default=""),
        Column("created_at", DateTime(timezone=True), server_default=func.now(), nullable=False),
        Index("idx_audit_tenant", "tenant_id"),
        Index("idx_audit_tenant_created", "tenant_id", "created_at"),
        Index("idx_audit_actor", "tenant_id", "user_id"),
    )

    # --- notifications ---
    op.create_table(
        "notifications",
        Column("id", UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        Column("tenant_id", UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False),
        Column("level", Text, nullable=False, default="info"),
        Column("title", Text, nullable=False),
        Column("message", Text, nullable=False, default=""),
        Column("link", Text, nullable=False, default=""),
        Column("read", Boolean, nullable=False, default=False),
        Column("created_at", DateTime(timezone=True), server_default=func.now(), nullable=False),
        Index("idx_notif_tenant", "tenant_id"),
    )

    # --- admin_settings ---
    op.create_table(
        "admin_settings",
        Column("id", UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        Column("tenant_id", UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False),
        Column("key", Text, nullable=False),
        Column("value", JSONB, nullable=False, default=dict),
        Column("updated_by", UUID(as_uuid=True), nullable=True),
        Column("updated_at", DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False),
        UniqueConstraint("tenant_id", "key", name="uq_admin_settings_key"),
        Index("idx_admin_settings_tenant", "tenant_id"),
    )

    # --- train_jobs ---
    op.create_table(
        "train_jobs",
        Column("id", UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        Column("tenant_id", UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False),
        Column("kind", Text, nullable=False),  # retrain | sync | upload | rollback
        Column("status", Text, nullable=False, default="running"),  # running|done|error
        Column("progress", Integer, nullable=False, default=0),
        Column("message", Text, nullable=False, default=""),
        Column("logs", JSONB, nullable=False, default=list),
        Column("started_by", UUID(as_uuid=True), nullable=True),
        Column("started_at", DateTime(timezone=True), server_default=func.now(), nullable=False),
        Column("finished_at", DateTime(timezone=True), nullable=True),
        Index("idx_train_tenant", "tenant_id"),
    )

    # --- message_feedback ---
    op.create_table(
        "message_feedback",
        Column("id", UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        Column("tenant_id", UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False),
        Column("conversation_id", UUID(as_uuid=True), nullable=True),
        Column("message_id", UUID(as_uuid=True), nullable=True),
        Column("rating", Integer, nullable=False, default=3),
        Column("comment", Text, nullable=False, default=""),
        Column("created_at", DateTime(timezone=True), server_default=func.now(), nullable=False),
        Index("idx_fb_tenant", "tenant_id"),
    )


def downgrade() -> None:
    op.drop_table("message_feedback")
    op.drop_table("train_jobs")
    op.drop_table("admin_settings")
    op.drop_table("notifications")
    op.drop_table("audit_logs")
    op.drop_table("answer_metrics")
    op.drop_table("unanswered_questions")
    op.drop_table("admin_document_versions")
    op.drop_table("admin_documents")