"""In-memory sliding-window rate limiting (ADR-008 seam; stdlib only).

Keys are per-session (user_id) and per-IP. Windows are rolling: a key is allowed
while fewer than ``limit`` timestamps are inside the last ``window_seconds``.
Retry-After is the seconds until the oldest stamp in the window falls out.

Memory bound: cached keys are evicted when the table exceeds ``_max_keys`` and
each key's window is pruned on access. Single-process only (one uvicorn worker) —
documented in the architecture; move to Redis for multi-worker deploys.

Two layers share the same limiter:
  * ``enforce`` / dependency guard (api/deps) — authenticated callers are limited
    per-session; guests additionally per-IP.
  * ``RateLimitMiddleware`` — envelope throttling for the few *unauthenticated*
    endpoints (login, guest issuance) where there is no JWT to key on yet.
A caller is therefore counted exactly once per layer and never double-penalized.
"""
from __future__ import annotations

import time
from collections import defaultdict, deque
from contextlib import suppress

MAX_KEYS = 10000


class SlidingWindowLimiter:
    def __init__(self) -> None:
        self._hits: dict[str, deque[float]] = defaultdict(deque)

    def _prune(self, key: str, window_seconds: int, now: float) -> None:
        hits = self._hits.get(key)
        if hits is None:
            return
        while hits and now - hits[0] > window_seconds:
            hits.popleft()
        if not hits:
            self._hits.pop(key, None)

    def _evict_if_full(self) -> None:
        if len(self._hits) < MAX_KEYS:
            return
        with suppress(StopIteration):
            self._hits.pop(next(iter(self._hits)))

    def check(
        self,
        *,
        key: str,
        limit: int,
        window_seconds: int,
        now: float | None = None,
    ) -> tuple[bool, int]:
        """Return (allowed, retry_after_seconds). Always allowed when limit <= 0."""
        if limit <= 0:
            return True, 0
        if now is None:
            now = time.monotonic()
        if key not in self._hits:
            self._evict_if_full()
        self._prune(key, window_seconds, now)
        hits = self._hits[key]
        if len(hits) < limit:
            hits.append(now)
            return True, 0
        oldest = hits[0]
        retry_after = int(max(0.0, oldest + window_seconds - now)) + 1
        return False, retry_after


_limiter = SlidingWindowLimiter()


def enforce(
    *,
    limit_per_minute: int,
    limit_per_day: int,
    session_key: str,
    ip_key: str,
    also_check_ip: bool = True,
) -> int | None:
    """Apply all configured windows. Return Retry-After seconds when blocked.

    ``also_check_ip`` gates the per-IP windows (used for guests); authenticated
    users share an office NAT, so by default only per-session limits apply."""
    stacks: list[tuple[int, int, str]] = [(limit_per_minute, 60, session_key), (limit_per_day, 86400, session_key)]
    if also_check_ip:
        stacks += [(limit_per_minute, 60, ip_key), (limit_per_day, 86400, ip_key)]
    for limit, window, key in stacks:
        allowed, retry = _limiter.check(key=key, limit=limit, window_seconds=window)
        if not allowed:
            return retry
    return None


# -- Middleware seam (ADR-008) -------------------------------------------------
# Envelope throttling for the handful of *unauthenticated* endpoints (login and
# guest issuance) where there is no JWT to key a session on, so only per-IP
# windows apply. All other traffic is governed by the dependency-level guard in
# api/deps, so a caller is counted exactly once per layer, never double-penalized.

from fastapi import Request  # noqa: E402
from starlette.middleware.base import BaseHTTPMiddleware  # noqa: E402
from starlette.responses import JSONResponse  # noqa: E402

from core.settings import settings  # noqa: E402

_ANON_THROTTLED_PATHS = {"/v1/auth/login", "/v1/auth/guest"}


def client_ip(request: Request) -> str:
    """Real client IP: honor the first X-Forwarded-For hop (present behind
    ngrok / reverse proxies), falling back to the socket peer."""
    via = request.headers.get("x-forwarded-for")
    if via:
        return via.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


class RateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        if request.method == "OPTIONS" or path not in _ANON_THROTTLED_PATHS:
            return await call_next(request)
        ip = client_ip(request)
        key = f"anon:{ip}"
        for limit, window in (
            (settings.auth_requests_per_minute, 60),
            (settings.auth_daily_requests, 86400),
        ):
            allowed, retry_after = _limiter.check(key=key, limit=limit, window_seconds=window)
            if not allowed:
                return JSONResponse(
                    {"detail": "rate limit exceeded", "retry_after": retry_after},
                    status_code=429,
                    headers={"Retry-After": str(retry_after)},
                )
        return await call_next(request)