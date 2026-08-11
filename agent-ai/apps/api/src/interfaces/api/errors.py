from __future__ import annotations

import traceback

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from domain.errors import AgentAIError, ErrorCode, RateLimitedError
from logging import get_logger

logger = get_logger("api.errors")


def problem_json(status: int, title: str, detail: str, trace_id: str | None, errors: list | None = None) -> JSONResponse:
    body = {
        "type": "about:blank",
        "title": title,
        "status": status,
        "detail": detail,
        "trace_id": trace_id,
    }
    if errors:
        body["errors"] = errors
    return JSONResponse(status_code=status, content=body)


def _trace_id(request: Request) -> str | None:
    return request.state.trace_id if hasattr(request.state, "trace_id") else None


def install_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(AgentAIError)
    async def handle_domain_error(request: Request, exc: AgentAIError) -> JSONResponse:
        if exc.status_code >= 500:
            logger.error("domain_error", error=exc.message, trace_id=_trace_id(request))
        else:
            logger.warning("domain_error", error=exc.message, trace_id=_trace_id(request))
        headers = {}
        if isinstance(exc, RateLimitedError):
            headers["Retry-After"] = str(exc.retry_after_seconds)
        return JSONResponse(
            status_code=exc.status_code,
            headers=headers,
            content={
                "type": f"urn:agentai:{exc.code.value}",
                "title": exc.code.value.replace("_", " "),
                "status": exc.status_code,
                "detail": exc.message,
                "trace_id": _trace_id(request),
            },
        )

    @app.exception_handler(RequestValidationError)
    async def handle_validation_error(request: Request, exc: RequestValidationError) -> JSONResponse:
        return problem_json(
            422,
            "validation error",
            "request failed validation",
            _trace_id(request),
            errors=exc.errors(),
        )

    @app.exception_handler(Exception)
    async def handle_unhandled(request: Request, exc: Exception) -> JSONResponse:
        logger.error(
            "unhandled_error",
            error=str(exc),
            trace_id=_trace_id(request),
            tb="".join(traceback.format_exception(exc)),
        )
        return problem_json(500, "internal error", "an unexpected error occurred", _trace_id(request))
