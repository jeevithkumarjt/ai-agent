"""Rate limiting — STUB (ADR-008).

A no-op middleware placeholder that sits at the correct position in the request
pipeline. No actual limiting logic is built yet: it is not needed for
local/single-user development, but the seam matters so the real implementation
slots in without restructuring.

The real implementation must:
  1. key on (client ip, tenant_id from JWT, route)
  2. enforce per-window limits with a small in-memory or Redis counter
  3. return 429 with a Retry-After header
"""
from __future__ import annotations

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response


async def _allow(request: Request) -> bool:
    """Placeholder policy — always allows. Replace with real limits behind this seam."""
    return True


class RateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        if not await _allow(request):
            return Response(status_code=429, content='{"detail":"rate limit exceeded"}', media_type="application/json")
        return await call_next(request)
