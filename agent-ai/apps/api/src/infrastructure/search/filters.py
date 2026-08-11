from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any


@dataclass
class RetrievalFilters:
    tenant_id: str
    source_version: int
    content_type: list[str] | None = None
    lang: list[str] | None = None
    source_ids: list[str] | None = None
    document_ids: list[str] | None = None
    published_after: datetime | None = None
    published_before: datetime | None = None
    category: list[str] | None = None

    def as_payload(self) -> dict[str, Any]:
        f: dict[str, Any] = {
            "tenant_id": self.tenant_id,
            "source_version": self.source_version,
        }
        if self.content_type:
            f["content_type"] = {"in": self.content_type}
        if self.lang:
            f["lang"] = {"in": self.lang}
        if self.source_ids:
            f["source_id"] = {"in": self.source_ids}
        if self.document_ids:
            f["document_id"] = {"in": self.document_ids}
        if self.category:
            f["category"] = {"in": self.category}
        ranges: dict[str, Any] = {}
        if self.published_after:
            ranges["gte"] = int(self.published_after.replace(tzinfo=timezone.utc).timestamp())
        if self.published_before:
            ranges["lte"] = int(self.published_before.replace(tzinfo=timezone.utc).timestamp())
        if ranges:
            f["published_at"] = ranges
        return f
