"""Shared FastAPI dependencies: JWT auth + tenant-scoped principals (ADR-005, ADR-004)."""
from __future__ import annotations

import uuid
from dataclasses import dataclass
from typing import Annotated

from core.auth import ExpiredToken, InvalidToken, decode_token
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

_bearer = HTTPBearer(auto_error=False)


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
