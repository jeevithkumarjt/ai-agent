from __future__ import annotations

from sqlalchemy import Boolean, ForeignKey, Index, Numeric, String, Text
from sqlalchemy.dialects.postgresql import ARRAY, JSONB
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.types import Uuid

from .base import Base, TimestampMixin, UUIDPkMixin


class GoldenQuestion(Base, UUIDPkMixin, TimestampMixin):
    __tablename__ = "golden_questions"

    tenant_id: Mapped[str] = mapped_column(Uuid(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    question: Mapped[str] = mapped_column(Text, nullable=False)
    answer_fragments: Mapped[list[str]] = mapped_column(ARRAY(Text), nullable=False, default=list)
    source_url: Mapped[str | None] = mapped_column(Text)
    category: Mapped[str] = mapped_column(String(64), nullable=False, default="general")
    active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)


class EvalRun(Base, UUIDPkMixin, TimestampMixin):
    __tablename__ = "eval_runs"
    __table_args__ = (Index("ix_eval_runs_tenant_time", "tenant_id", "created_at"),)

    tenant_id: Mapped[str] = mapped_column(Uuid(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    trigger: Mapped[str] = mapped_column(String(32), nullable=False, default="manual")
    status: Mapped[str] = mapped_column(String(16), nullable=False, default="running")
    score_overall: Mapped[float | None] = mapped_column(Numeric(5, 4))
    score_grounded: Mapped[float | None] = mapped_column(Numeric(5, 4))
    score_citation: Mapped[float | None] = mapped_column(Numeric(5, 4))
    score_freshness: Mapped[float | None] = mapped_column(Numeric(5, 4))
    passed: Mapped[bool | None] = mapped_column(Boolean)
    details: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
