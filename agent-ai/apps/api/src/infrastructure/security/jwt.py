from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone

import jwt

from config import settings
from domain.errors import UnauthorizedError


class TokenType:
    ACCESS = "access"
    REFRESH = "refresh"


def _encode(sub: str, tenant_id: uuid.UUID, role: str, token_type: str, ttl: timedelta) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": sub,
        "tenant_id": str(tenant_id),
        "role": role,
        "type": token_type,
        "iat": now,
        "exp": now + ttl,
        "jti": str(uuid.uuid4()),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def create_access_token(sub: str, tenant_id: uuid.UUID, role: str) -> str:
    return _encode(
        sub,
        tenant_id,
        role,
        TokenType.ACCESS,
        timedelta(minutes=settings.jwt_access_ttl_minutes),
    )


def create_refresh_token(sub: str, tenant_id: uuid.UUID, role: str) -> str:
    return _encode(
        sub,
        tenant_id,
        role,
        TokenType.REFRESH,
        timedelta(days=settings.jwt_refresh_ttl_days),
    )


def decode_token(token: str, expected_type: str) -> dict:
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    except jwt.ExpiredSignatureError as exc:
        raise UnauthorizedError("token expired") from exc
    except jwt.InvalidTokenError as exc:
        raise UnauthorizedError("invalid token") from exc
    if payload.get("type") != expected_type:
        raise UnauthorizedError("wrong token type")
    return payload
