from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Index, Integer, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.types import Uuid

from .base import Base, TimestampMixin, UUIDPkMixin


class KnowledgeSource(Base, UUIDPkMixin, TimestampMixin):
    __tablename__ = "knowledge_sources"

    tenant_id: Mapped[str] = mapped_column(Uuid(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    type: Mapped[str] = mapped_column(String(64), nullable=False)
    display_name: Mapped[str] = mapped_column(Text, nullable=False)
    config: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    state: Mapped[str] = mapped_column(String(16), nullable=False, default="enabled")
    schedule: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    version: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    last_crawl_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    error: Mapped[str | None] = mapped_column(Text)


class CrawlJob(Base, UUIDPkMixin, TimestampMixin):
    __tablename__ = "crawl_jobs"
    __table_args__ = (Index("ix_crawl_jobs_source_time", "source_id", "created_at"),)

    tenant_id: Mapped[str] = mapped_column(Uuid(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    source_id: Mapped[str] = mapped_column(Uuid(as_uuid=True), ForeignKey("knowledge_sources.id", ondelete="CASCADE"), nullable=False)
    kind: Mapped[str] = mapped_column(String(32), nullable=False, default="full")
    status: Mapped[str] = mapped_column(String(16), nullable=False, default="queued")
    total_pages: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    changed_pages: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    failed_pages: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    error: Mapped[str | None] = mapped_column(Text)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
