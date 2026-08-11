from __future__ import annotations

import json
from typing import Any

import redis.asyncio as redis

from config import settings
from logging import get_logger

logger = get_logger("db.redis")

_client: redis.Redis | None = None
_queue_client: redis.Redis | None = None


def get_redis() -> redis.Redis:
    global _client
    if _client is None:
        _client = redis.from_url(
            settings.redis_url,
            encoding="utf-8",
            decode_responses=True,
            socket_connect_timeout=5,
            socket_timeout=5,
            health_check_interval=30,
        )
    return _client


def get_queue_redis() -> redis.Redis:
    global _queue_client
    if _queue_client is None:
        _queue_client = redis.from_url(
            settings.redis_queue_url,
            encoding="utf-8",
            decode_responses=True,
            socket_connect_timeout=5,
            health_check_interval=30,
        )
    return _queue_client


async def close_redis() -> None:
    global _client, _queue_client
    for c in (_client, _queue_client):
        if c is not None:
            await c.aclose()
    _client = None
    _queue_client = None


async def get_json(key: str) -> dict[str, Any] | None:
    raw = await get_redis().get(key)
    return json.loads(raw) if raw else None


async def set_json(key: str, value: dict[str, Any], ttl: int) -> None:
    import json

    await get_redis().set(key, json.dumps(value), ex=ttl)


async def scan_keys(pattern: str) -> list[str]:
    keys: list[str] = []
    async for key in get_redis().scan_iter(match=pattern, count=500):
        keys.append(key)
    return keys


async def delete_pattern(pattern: str) -> int:
    keys = await scan_keys(pattern)
    if not keys:
        return 0
    return await get_redis().delete(*keys)
