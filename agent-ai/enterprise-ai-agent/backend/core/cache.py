"""Cache layer (ADR-008 seam). Default is an in-process TTL cache; an optional
Redis backend can be enabled with CACHE_BACKEND=redis for multi-worker deploys.

The Redis client is imported lazily and is NOT a hard dependency — if it is
missing, misconfigured, or unreachable the cache logs once and silently falls
back to the in-memory backend, so chat never breaks because of caching.
"""
from __future__ import annotations

import json
import time
from collections import OrderedDict
from typing import Any

from core.logging import get_logger
from core.settings import settings

logger = get_logger("core.cache")

_MSG = object()


class Cache:
    async def get(self, key: str) -> Any:  # pragma: no cover - interface
        raise NotImplementedError

    async def set(self, key: str, value: Any, ttl_seconds: int) -> None:  # pragma: no cover - interface
        raise NotImplementedError

    async def delete(self, key: str) -> None:  # pragma: no cover - interface
        raise NotImplementedError

    async def clear_prefix(self, prefix: str) -> None:  # pragma: no cover - interface
        raise NotImplementedError


class MemoryCache(Cache):
    """In-process TTL cache with LRU eviction (single uvicorn worker)."""

    def __init__(self, *, maxsize: int = 2048) -> None:
        self._maxsize = maxsize
        self._data: OrderedDict[str, tuple[float, Any]] = OrderedDict()

    def _prune(self, now: float) -> None:
        stale = [k for k, (exp, _) in self._data.items() if exp <= now]
        for k in stale:
            self._data.pop(k, None)

    async def get(self, key: str) -> Any:
        now = time.monotonic()
        self._prune(now)
        entry = self._data.get(key)
        if entry is None:
            return None
        if entry[0] <= now:
            del self._data[key]
            return None
        self._data.move_to_end(key)
        return entry[1]

    async def set(self, key: str, value: Any, ttl_seconds: int) -> None:
        self._data[key] = (time.monotonic() + max(ttl_seconds, 0), value)
        self._data.move_to_end(key)
        while len(self._data) > self._maxsize:
            self._data.popitem(last=False)

    async def delete(self, key: str) -> None:
        self._data.pop(key, None)

    async def clear_prefix(self, prefix: str) -> None:
        for k in [k for k in self._data if k.startswith(prefix)]:
            self._data.pop(k, None)


class RedisCache(Cache):
    """Redis backend for multi-worker deploys. Falls back to memory on any trouble."""

    def __init__(self, url: str, *, maxsize: int = 2048) -> None:
        self._url = url
        self._fallback = MemoryCache(maxsize=maxsize)
        self._redis: Any = None
        self._warned = False
        try:
            import redis.asyncio as aioredis  # type: ignore[import-not-found]

            self._redis = aioredis.from_url(url, decode_responses=True)
        except Exception as exc:  # noqa: BLE001
            logger.warning("cache_redis_import_failed_using_memory", error=str(exc))
            self._redis = None

    async def _backend(self) -> Any:
        if self._redis is None:
            return self._fallback
        try:
            await self._redis.ping()
            return self._redis
        except Exception as exc:  # noqa: BLE001
            if not self._warned:
                self._warned = True
                logger.warning("cache_redis_unreachable_using_memory", error=str(exc))
            return self._fallback

    async def get(self, key: str) -> Any:
        backend = await self._backend()
        if backend is self._fallback:
            return await backend.get(key)
        try:
            raw = await backend.get(key)
            return json.loads(raw) if raw is not None else None
        except Exception as exc:  # noqa: BLE001
            logger.warning("cache_redis_get_failed", error=str(exc))
            return None

    async def set(self, key: str, value: Any, ttl_seconds: int) -> None:
        backend = await self._backend()
        if backend is self._fallback:
            await backend.set(key, value, ttl_seconds)
            return
        try:
            await backend.set(key, json.dumps(value, default=str), ex=max(ttl_seconds, 0))
        except Exception as exc:  # noqa: BLE001
            logger.warning("cache_redis_set_failed", error=str(exc))

    async def delete(self, key: str) -> None:
        backend = await self._backend()
        if backend is self._fallback:
            await backend.delete(key)
            return
        try:
            await backend.delete(key)
        except Exception as exc:  # noqa: BLE001
            logger.warning("cache_redis_delete_failed", error=str(exc))

    async def clear_prefix(self, prefix: str) -> None:
        backend = await self._backend()
        if backend is self._fallback:
            await backend.clear_prefix(prefix)
            return
        try:
            pattern = f"{prefix}*"
            async for key in backend.scan_iter(match=pattern):
                await backend.delete(key)
        except Exception as exc:  # noqa: BLE001
            logger.warning("cache_redis_clear_failed", error=str(exc))


_cache: Cache | None = None


def get_cache() -> Cache:
    """Process-wide cache singleton (memory by default; redis behind a flag)."""
    global _cache
    if _cache is None:
        if settings.cache_backend == "redis" and settings.cache_redis_url:
            _cache = RedisCache(settings.cache_redis_url, maxsize=settings.cache_rag_maxsize)
        else:
            _cache = MemoryCache(maxsize=settings.cache_rag_maxsize)
    return _cache