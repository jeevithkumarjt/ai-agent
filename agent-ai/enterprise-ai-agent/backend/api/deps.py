"""Shared FastAPI dependencies: JWT auth + tenant-scoped principals (ADR-005, ADR-004)."""
from __future__ import annotations

import uuid
from dataclasses import dataclass
from typing import Annotated

from core.auth import ExpiredToken, InvalidToken, decode_token
from core.rate_limit import client_ip
from core.rate_limit import enforce as enforce_rate_limit
from core.settings import settings
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

_bearer = HTTPBearer(auto_error=False)


def _client_ip(request: Request) -> str:
    return client_ip(request)


@dataclass(frozen=True)
class Principal:
    user_id: uuid.UUID
    tenant_id: uuid.UUID
    role: str


def require_auth(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer)],
) -> Principal:
    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="missing bearer token")
    try:
        payload = decode_token(credentials.credentials, expected="access")
        user_id = uuid.UUID(payload["sub"])
        tenant_id = uuid.UUID(payload["tenant_id"])
    except (InvalidToken, ExpiredToken, ValueError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="invalid or expired access token") from None
    return Principal(user_id=user_id, tenant_id=tenant_id, role=payload.get("role", "viewer"))


def enforce_message_rate_limit(
    request: Request,
    principal: Annotated[Principal, Depends(require_auth)],
) -> None:
    """Per-session (and per-IP for guests) sliding-window rate limit on LLM
    endpoints. Returns 429 + Retry-After when exceeded.
    Guests are the anonymous sessions granted ``guest_role`` (their user row is
    created by /v1/auth/guest); authenticated users get higher per-session limits."""
    is_guest = principal.role == settings.guest_role
    retry_after = enforce_rate_limit(
        limit_per_minute=settings.guest_requests_per_minute if is_guest else settings.auth_requests_per_minute,
        limit_per_day=settings.guest_daily_requests if is_guest else settings.auth_daily_requests,
        session_key=f"user:{principal.user_id}",
        ip_key=f"ip:{_client_ip(request)}",
        also_check_ip=is_guest,
    )
    if retry_after is not None:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="rate limit exceeded: please wait and try again",
            headers={"Retry-After": str(retry_after)},
        )