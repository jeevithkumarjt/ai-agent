"""Admin portal ORM models.

These tables are managed by the admin portal (never touched by the core agent
loop) and are created via ``create_all`` on the dedicated ``AdminBase`` registry
at app startup, so the existing alembic-managed core schema stays untouched.

Roles follow the existing ``users.role`` constraint:
  owner  -> Super Admin, admin -> Admin, editor -> Trainer, viewer -> Viewer
"""
from __future__ import annotations

import uuid
from datetime import date as DateType, datetime
from typing import Any

from pgvector.sqlalchemy import Vector  # noqa: F401  (ensures Vector type is registered)
from sqlalchemy import (
    BigInteger,
    Boolean,
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
from sqlalchemy.orm import Mapped, mapped_column

from db.models import Base as CoreBase


class AdminBase(CoreBase):
    """Admin models share the core metadata so FKs to core tables resolve; the
    same create_all with checkfirst is idempotent for existing core tables."""

    __abstract__ = True


def _pk() -> Mapped[uuid.UUID]:
    return mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)


def _tenant() -> Mapped[uuid.UUID]:
    return mapped_column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)


def _ts() -> Mapped[datetime]:
    return mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class AdminDocument(AdminBase):
    __tablename__ = "admin_documents"
    __table_args__ = (
        UniqueConstraint("tenant_id", "path", name="uq_admin_docs_path"),
        Index("idx_admin_docs_tenant", "tenant_id"),
        Index("idx_admin_docs_status", "tenant_id", "status"),
        Index("idx_admin_docs_checksum", "tenant_id", "checksum"),
    )

    id: Mapped[uuid.UUID] = _pk()
    tenant_id: Mapped[uuid.UUID] = _tenant()
    name: Mapped[str] = mapped_column(Text, nullable=False)
    path: Mapped[str] = mapped_column(Text, nullable=False)
    kind: Mapped[str] = mapped_column(Text, nullable=False, default="file")  # file | manual | unanswered
    ext: Mapped[str] = mapped_column(Text, nullable=False, default="")
    size_bytes: Mapped[int] = mapped_column(BigInteger, nullable=False, default=0)
    checksum: Mapped[str] = mapped_column(Text, nullable=False, default="")
    version: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    title: Mapped[str] = mapped_column(Text, nullable=False, default="")
    content_text: Mapped[str] = mapped_column(Text, nullable=False, default="")
    meta: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False, default=dict)
    status: Mapped[str] = mapped_column(Text, nullable=False, default="draft")  # draft | indexed | error
    error: Mapped[str] = mapped_column(Text, nullable=False, default="")
    created_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    created_at: Mapped[datetime] = _ts()
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )
    last_indexed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class AdminDocumentVersion(AdminBase):
    __tablename__ = "admin_document_versions"
    __table_args__ = (
        Index("idx_admin_ver_doc", "tenant_id", "document_id"),
        UniqueConstraint("document_id", "version", name="uq_admin_ver_doc_version"),
    )

    id: Mapped[uuid.UUID] = _pk()
    tenant_id: Mapped[uuid.UUID] = _tenant()
    document_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("admin_documents.id", ondelete="CASCADE"), nullable=False
    )
    version: Mapped[int] = mapped_column(Integer, nullable=False)
    checksum: Mapped[str] = mapped_column(Text, nullable=False, default="")
    content_text: Mapped[str] = mapped_column(Text, nullable=False, default="")
    reason: Mapped[str] = mapped_column(Text, nullable=False, default="")
    created_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    created_at: Mapped[datetime] = _ts()


class UnansweredQuestion(AdminBase):
    __tablename__ = "unanswered_questions"
    __table_args__ = (
        Index("idx_uq_tenant", "tenant_id"),
        Index("idx_uq_status", "tenant_id", "status"),
    )

    id: Mapped[uuid.UUID] = _pk()
    tenant_id: Mapped[uuid.UUID] = _tenant()
    question: Mapped[str] = mapped_column(Text, nullable=False)
    conversation_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    source: Mapped[str] = mapped_column(Text, nullable=False, default="auto")  # auto | low_confidence | manual
    status: Mapped[str] = mapped_column(Text, nullable=False, default="new")  # new | answered | approved | dismissed
    answer: Mapped[str] = mapped_column(Text, nullable=False, default="")
    confidence: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    answer_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    answer_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = _ts()
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )


class AnswerMetric(AdminBase):
    __tablename__ = "answer_metrics"
    __table_args__ = (
        Index("idx_am_tenant", "tenant_id"),
        Index("idx_am_tenant_created", "tenant_id", "created_at"),
    )

    id: Mapped[uuid.UUID] = _pk()
    tenant_id: Mapped[uuid.UUID] = _tenant()
    conversation_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    message_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    question: Mapped[str] = mapped_column(Text, nullable=False, default="")
    answer_length: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    response_time_ms: Mapped[int] = mapped_column(BigInteger, nullable=False, default=0)
    tool_calls: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    answered: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    confidence: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    created_at: Mapped[datetime] = _ts()


class AuditLog(AdminBase):
    __tablename__ = "audit_logs"
    __table_args__ = (
        Index("idx_audit_tenant", "tenant_id"),
        Index("idx_audit_tenant_created", "tenant_id", "created_at"),
        Index("idx_audit_actor", "tenant_id", "user_id"),
    )

    id: Mapped[uuid.UUID] = _pk()
    tenant_id: Mapped[uuid.UUID] = _tenant()
    user_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    email: Mapped[str] = mapped_column(Text, nullable=False, default="")
    role: Mapped[str] = mapped_column(Text, nullable=False, default="")
    action: Mapped[str] = mapped_column(Text, nullable=False)
    target_type: Mapped[str] = mapped_column(Text, nullable=False, default="")
    target_id: Mapped[str] = mapped_column(Text, nullable=False, default="")
    detail: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False, default=dict)
    ip: Mapped[str] = mapped_column(Text, nullable=False, default="")
    created_at: Mapped[datetime] = _ts()


class Notification(AdminBase):
    __tablename__ = "notifications"
    __table_args__ = (Index("idx_notif_tenant", "tenant_id"),)

    id: Mapped[uuid.UUID] = _pk()
    tenant_id: Mapped[uuid.UUID] = _tenant()
    level: Mapped[str] = mapped_column(Text, nullable=False, default="info")  # info|success|warning|error
    title: Mapped[str] = mapped_column(Text, nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False, default="")
    link: Mapped[str] = mapped_column(Text, nullable=False, default="")
    read: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = _ts()


class AdminSetting(AdminBase):
    __tablename__ = "admin_settings"
    __table_args__ = (
        UniqueConstraint("tenant_id", "key", name="uq_admin_settings_key"),
        Index("idx_admin_settings_tenant", "tenant_id"),
    )

    id: Mapped[uuid.UUID] = _pk()
    tenant_id: Mapped[uuid.UUID] = _tenant()
    key: Mapped[str] = mapped_column(Text, nullable=False)
    value: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False, default=dict)
    updated_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )


class UsageMetric(AdminBase):
    __tablename__ = "usage_metrics"
    __table_args__ = (
        UniqueConstraint("tenant_id", "date", name="uq_usage_metrics_tenant_date"),
        Index("idx_usage_metrics_tenant_date", "tenant_id", "date"),
    )

    id: Mapped[uuid.UUID] = _pk()
    tenant_id: Mapped[uuid.UUID] = _tenant()
    date: Mapped[DateType] = mapped_column(nullable=False)
    messages_sent: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    seats: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    kb_size_mb: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)


class TrainJob(AdminBase):
    __tablename__ = "train_jobs"
    __table_args__ = (Index("idx_train_tenant", "tenant_id"),)

    id: Mapped[uuid.UUID] = _pk()
    tenant_id: Mapped[uuid.UUID] = _tenant()
    kind: Mapped[str] = mapped_column(Text, nullable=False)  # retrain | sync | upload | rollback
    status: Mapped[str] = mapped_column(Text, nullable=False, default="running")  # running|done|error
    progress: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    message: Mapped[str] = mapped_column(Text, nullable=False, default="")
    logs: Mapped[list[Any]] = mapped_column(JSONB, nullable=False, default=list)
    started_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    started_at: Mapped[datetime] = _ts()
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class MessageFeedback(AdminBase):
    __tablename__ = "message_feedback"
    __table_args__ = (Index("idx_fb_tenant", "tenant_id"),)

    id: Mapped[uuid.UUID] = _pk()
    tenant_id: Mapped[uuid.UUID] = _tenant()
    conversation_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    message_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    rating: Mapped[int] = mapped_column(Integer, nullable=False, default=3)
    comment: Mapped[str] = mapped_column(Text, nullable=False, default="")
    created_at: Mapped[datetime] = _ts()


__all__ = [
    "AdminBase",
    "AdminDocument",
    "AdminDocumentVersion",
    "UnansweredQuestion",
    "AnswerMetric",
    "AuditLog",
    "Notification",
    "AdminSetting",
    "TrainJob",
    "MessageFeedback",
    "UsageMetric",
]
