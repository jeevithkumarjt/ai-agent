from __future__ import annotations

from sqlalchemy import ForeignKey, Index, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.types import Uuid

from .base import Base, TimestampMixin, UUIDPkMixin


class Event(Base, UUIDPkMixin, TimestampMixin):
    """Immutable domain + audit event stream."""

    __tablename__ = "events"
    __table_args__ = (Index("ix_events_type_time", "tenant_id", "type", "created_at"),)

    tenant_id: Mapped[str] = mapped_column(Uuid(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    type: Mapped[str] = mapped_column(String(128), nullable=False)
    payload: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    actor: Mapped[str | None] = mapped_column(Text)
    trace_id: Mapped[str | None] = mapped_column(Text)


class AuditLog(Base, UUIDPkMixin, TimestampMixin):
    __tablename__ = "audit_logs"
    __table_args__ = (Index("ix_audit_tenant_time", "tenant_id", "created_at"),)

    tenant_id: Mapped[str] = mapped_column(Uuid(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    actor_id: Mapped[str | None] = mapped_column(Uuid(as_uuid=True))
    action: Mapped[str] = mapped_column(String(128), nullable=False)
    resource_type: Mapped[str | None] = mapped_column(String(64))
    resource_id: Mapped[str | None] = mapped_column(Text)
    meta: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    ip: Mapped[str | None] = mapped_column(Text)
