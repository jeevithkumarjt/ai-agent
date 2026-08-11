from __future__ import annotations

import time

from fastapi import APIRouter
from sqlalchemy import text

from config import settings
from db.redis import get_redis
from domain.schemas.common import HealthReport, HealthStatus
from logging import get_logger

logger = get_logger("api.health")

router = APIRouter(prefix="/health", tags=["health"])


async def _postgres_check() -> HealthStatus:
    start = time.perf_counter()
    from db.session import engine

    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        return HealthStatus(name="postgres", ok=True, latency_ms=_ms(start))
    except Exception as exc:
        return HealthStatus(name="postgres", ok=False, latency_ms=_ms(start), detail=str(exc))


async def _redis_check() -> HealthStatus:
    start = time.perf_counter()
    try:
        await get_redis().ping()
        return HealthStatus(name="redis", ok=True, latency_ms=_ms(start))
    except Exception as exc:
        return HealthStatus(name="redis", ok=False, latency_ms=_ms(start), detail=str(exc))


async def _qdrant_check() -> HealthStatus:
    from infrastructure.providers.vector.qdrant import QdrantVectorStore

    start = time.perf_counter()
    store = QdrantVectorStore()
    try:
        ok = await store.healthcheck()
        return HealthStatus(name="qdrant", ok=ok, latency_ms=_ms(start))
    except Exception as exc:
        return HealthStatus(name="qdrant", ok=False, latency_ms=_ms(start), detail=str(exc))


def _ms(start: float) -> int:
    return int((time.perf_counter() - start) * 1000)


@router.get("/live", response_model=dict)
async def live() -> dict:
    return {"status": "ok"}


@router.get("/ready", response_model=HealthReport)
async def ready() -> HealthReport:
    checks = [await _postgres_check(), await _redis_check(), await _qdrant_check()]
    status = "ok" if all(c.ok for c in checks) else ("degraded" if any(c.ok for c in checks) else "down")
    return HealthReport(status=status, checks=checks)


@router.get("/deps", response_model=HealthReport)
async def deps() -> HealthReport:
    checks = [await _postgres_check(), await _redis_check(), await _qdrant_check()]
    status = "ok" if all(c.ok for c in checks) else "degraded"
    return HealthReport(status=status, checks=checks)
