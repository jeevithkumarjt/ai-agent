from __future__ import annotations

import uuid
from contextlib import asynccontextmanager

from opentelemetry import trace
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

from logging import get_logger

logger = get_logger("middleware.context")


class RequestContextMiddleware(BaseHTTPMiddleware):
    """Attaches trace_id + request context; bind into structlog contextvars per request."""

    async def dispatch(self, request: Request, call_next):
        import structlog

        trace_id = trace.get_current_span().get_span_context().trace_id if trace.get_current_span().is_recording() else None
        if not trace_id:
            trace_id = uuid.uuid4().int & ((1 << 64) - 1)
        request.state.trace_id = f"{trace_id:032x}"
        ctx = {
            "trace_id": request.state.trace_id,
            "method": request.method,
            "path": request.url.path,
        }
        structlog.contextvars.bind_contextvars(**ctx)
        try:
            response = await call_next(request)
        finally:
            structlog.contextvars.unbind_contextvars(*ctx.keys())
        response.headers["X-Trace-Id"] = request.state.trace_id
        return response
