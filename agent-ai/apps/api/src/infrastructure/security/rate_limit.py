from __future__ import annotations

import uuid

from db.redis import get_redis
from domain.errors import RateLimitedError


async def check_rate_limit(key: str, limit_per_minute: int) -> None:
    """Sliding-window rate limit in Redis. Raises RateLimitedError when exhausted."""
    redis = get_redis()
    window = 60
    now = int(__import__("time").time())
    bucket_key = f"ratelimit:{key}:{now // window}"
    pipe = redis.pipeline()
    pipe.incr(bucket_key)
    pipe.expire(bucket_key, window + 1)
    count = (await pipe.execute())[0]
    if count > limit_per_minute:
        retry_after = window - (now % window)
        raise RateLimitedError("rate limit exceeded", retry_after_seconds=retry_after)


def rate_key(prefix: str, user_id: uuid.UUID | None, ip: str | None) -> str:
    ident = str(user_id) if user_id else (ip or "anon")
    return f"{prefix}:{ident}"
