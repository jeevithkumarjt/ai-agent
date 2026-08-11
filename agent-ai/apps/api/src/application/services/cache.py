from __future__ import annotations

from config import settings
from db.redis import delete_pattern
from logging import get_logger
from telemetry import counter

logger = get_logger("cache")

invalidation_counter = counter("agentai_ingest_cache_invalidations_total", "Cache namespace invalidations")


async def invalidate_tenant(tenant_id: str, source_id: str) -> int:
    """Atomically invalidate every content-derived cache namespace for a source.

    Keys are namespaced by tenant + source version, so a single namespace wipe guarantees no
    stale retrievals or responses after content changes.
    """
    if not settings.cache_enabled:
        return 0
    total = 0
    for prefix in (
        f"agentai:{tenant_id}:cache:retrieval:*",
        f"agentai:{tenant_id}:cache:response:*",
        f"agentai:{tenant_id}:kw:*",
        f"agentai:{tenant_id}:cache:query:*",
    ):
        total += await delete_pattern(prefix)
    invalidation_counter.add(1)
    logger.info("cache_invalidated", tenant_id=tenant_id, source_id=source_id, keys=total)
    return total
