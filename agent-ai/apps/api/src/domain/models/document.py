from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.types import Uuid

from .base import Base, TimestampMixin, UUIDPkMixin


class Document(Base, UUIDPkMixin, TimestampMixin):
    __tablename__ = "documents"
    __table_args__ = (
        Index("uq_documents_source_url", "source_id", "canonical_url", unique=True),
        Index("ix_documents_tenant_status", "tenant_id", "source_id", "status"),
        Index("ix_documents_updated", "updated_at"),
    )

    tenant_id: Mapped[str] = mapped_column(Uuid(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    source_id: Mapped[str] = mapped_column(Uuid(as_uuid=True), ForeignKey("knowledge_sources.id", ondelete="CASCADE"), nullable=False)
    canonical_url: Mapped[str] = mapped_column(Text, nullable=False)
    content_type: Mapped[str] = mapped_column(String(128), nullable=False, default="text/html")
    title: Mapped[str | None] = mapped_column(Text)
    lang: Mapped[str | None] = mapped_column(String(16))
    sha256: Mapped[str] = mapped_column(String(64), nullable=False)
    etag: Mapped[str | None] = mapped_column(Text)
    last_modified: Mapped[str | None] = mapped_column(Text)
    version: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    status: Mapped[str] = mapped_column(String(16), nullable=False, default="pending")
    error: Mapped[str | None] = mapped_column(Text)
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class Chunk(Base, UUIDPkMixin, TimestampMixin):
    __tablename__ = "chunks"
    __table_args__ = (
        Index("ix_chunks_document_version", "document_id", "doc_version"),
        Index("ix_chunks_tenant_embedded", "tenant_id", "embedded"),
    )

    tenant_id: Mapped[str] = mapped_column(Uuid(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    document_id: Mapped[str] = mapped_column(Uuid(as_uuid=True), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    doc_version: Mapped[int] = mapped_column(Integer, nullable=False)
    section_path: Mapped[str] = mapped_column(Text, nullable=False, default="/")
    heading: Mapped[str | None] = mapped_column(Text)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    char_offset: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    lang: Mapped[str | None] = mapped_column(String(16))
    sha256: Mapped[str] = mapped_column(String(64), nullable=False)
    embedded: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
