"""Rate limiting (ADR-008) — in-memory sliding window per (client ip, route).

Deliberately dependency-free (no Redis) so the free tier keeps working. Keys on
client IP so it survives without a proxy; if you deploy behind a reverse proxy,
terminate TLS there and pass the real client IP (e.g. X-Forwarded-For) so this
still keys on the right address.

Limits are generous for normal users and tighter for the anonymous guest-login
endpoint. Every deny returns 429 with a `Retry-After` header; the chat frontends
surface that as a friendly "slow down" message instead of a raw error.
"""
from __future__ import annotations

import threading
import time
from collections import defaultdict
from collections.abc import Callable

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

# (per-IP, per-minute) limits — route-specific overrides win.
_ROUTE_LIMITS: dict[str, int] = {
    "/v1/auth/guest": 20,          # anonymous demo sessions (also capped by settings.guest_requests_per_minute)
    "/v1/auth/login": 30,          # credential brute-force guard
    "/v1/auth/refresh": 60,
}
_DEFAULT_LIMIT = 600               # everything else: 600 req/min/IP is generous
_WINDOW_SECONDS = 60


class _SlidingWindow:
    def __init__(self) -> None:
        self._hits: dict[str, list[float]] = defaultdict(list)
        self._lock = threading.Lock()

    def allow(self, key: str, limit: int, window: int) -> tuple[bool, float]:
        """Return (allowed, retry_after_seconds)."""
        now = time.monotonic()
        with self._lock:
            bucket = self._hits[key]
            bucket[:] = [t for t in bucket if t > now - window]
            if len(bucket) >= limit:
                retry = bucket[0] + window - now if bucket else float(window)
                return False, retry
            bucket.append(now)
            return True, 0.0


_limiter = _SlidingWindow()


def _client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for", "")
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.client is not None:
        return request.client.host
    return "unknown"


class RateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        limit = _ROUTE_LIMITS.get(request.url.path, _DEFAULT_LIMIT)
        key = f"{_client_ip(request)}:{request.url.path}"
        allowed, retry_after = _limiter.allow(key, limit, _WINDOW_SECONDS)
        if not allowed:
            return Response(
                status_code=429,
                content='{"detail":"Too many requests. Please slow down and try again."}',
                media_type="application/json",
                headers={"Retry-After": str(int(retry_after) or 1)},
            )
        return await call_next(request)
