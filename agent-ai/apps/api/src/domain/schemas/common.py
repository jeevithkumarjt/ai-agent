from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class Paginated(BaseModel):
    items: list[Any]
    total: int
    limit: int
    offset: int


class HealthStatus(BaseModel):
    name: str
    ok: bool
    latency_ms: int
    detail: str | None = None


class HealthReport(BaseModel):
    status: Literal["ok", "degraded", "down"]
    checks: list[HealthStatus]
