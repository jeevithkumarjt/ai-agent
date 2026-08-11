from __future__ import annotations

"""Integration tests requiring the Docker Compose stack (postgres, redis, qdrant)."""

import pytest

pytestmark = pytest.mark.integration


@pytest.mark.asyncio
async def test_health_report_ok() -> None:
    from interfaces.api.routes_health import deps

    report = await deps()
    assert report.status in {"ok", "degraded"}
    names = {c.name for c in report.checks}
    assert {"postgres", "redis", "qdrant"} <= names


@pytest.mark.asyncio
async def test_db_ping() -> None:
    from db.session import ping

    await ping()


@pytest.mark.asyncio
async def test_redis_ping() -> None:
    from db.redis import get_redis

    assert await get_redis().ping() is True


@pytest.mark.asyncio
async def test_qdrant_roundtrip() -> None:
    from infrastructure.providers.vector.qdrant import QdrantVectorStore

    store = QdrantVectorStore()
    collection = "test_roundtrip"
    await store.delete_collection(name=collection) if await store.collection_exists(name=collection) else None
    await store.ensure_collection(name=collection, dim=8)
    from qdrant_client import models

    await store.upsert(
        collection=collection,
        points=[
            models.PointStruct(
                id="11111111-1111-1111-1111-111111111111",
                vector={"dense": [0.1] * 8},
                payload={"tenant_id": "t1", "source_version": 1, "text": "hello world"},
            )
        ],
    )
    hits = await store.search_dense(
        collection=collection, vector=[0.1] * 8, filters={"tenant_id": "t1", "source_version": 1}, limit=5
    )
    assert len(hits) == 1
    await store.delete_collection(name=collection)


@pytest.mark.asyncio
async def test_api_health_endpoint() -> None:
    import httpx

    from config import settings

    async with httpx.AsyncClient(base_url="http://localhost:8000") as client:
        resp = await client.get("/health/ready")
        assert resp.status_code == 200
        assert resp.json()["status"] in {"ok", "degraded"}
