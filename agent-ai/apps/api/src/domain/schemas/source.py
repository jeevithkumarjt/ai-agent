from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field

from .common import ORMModel


class Schedule(BaseModel):
    mode: Literal["manual", "cron", "daily"] = "manual"
    cron: str | None = None


class SourceCreate(BaseModel):
    type: Literal[
        "website",
        "sitemap",
        "pdf",
        "docx",
        "csv",
        "txt",
        "md",
        "image",
        "video",
        "api",
        "sharepoint",
        "confluence",
        "notion",
        "gdrive",
        "onedrive",
        "crm",
    ] = "website"
    display_name: str | None = None
    config: dict[str, Any] = Field(default_factory=dict)
    schedule: Schedule = Field(default_factory=Schedule)
    workspace_id: uuid.UUID | None = None


class SourceOut(ORMModel):
    id: uuid.UUID
    tenant_id: uuid.UUID
    type: str
    display_name: str
    config: dict[str, Any]
    state: str
    schedule: dict[str, Any]
    version: int
    last_crawl_at: datetime | None
    error: str | None
    created_at: datetime
    updated_at: datetime


class SourcePatch(BaseModel):
    display_name: str | None = None
    config: dict[str, Any] | None = None
    state: Literal["enabled", "paused", "disabled"] | None = None
    schedule: Schedule | None = None


class SourceStats(SourceOut):
    document_count: int = 0
    chunk_count: int = 0
    last_job_status: str | None = None


class CrawlTrigger(BaseModel):
    kind: Literal["full", "incremental", "single"] = "incremental"
    url: str | None = None


class JobOut(ORMModel):
    id: uuid.UUID
    source_id: uuid.UUID
    kind: str
    status: str
    total_pages: int
    changed_pages: int
    failed_pages: int
    error: str | None
    started_at: datetime | None
    finished_at: datetime | None
    created_at: datetime


class WebhookContent(BaseModel):
    url: str
    event: Literal["published", "updated", "deleted"] = "updated"
    signature: str | None = None
    timestamp: str | None = None


class WebhookAck(BaseModel):
    accepted: bool
    job_id: uuid.UUID | None = None
