"""JWT auth (ADR-005): stateless tokens carrying tenant_id, user_id, exp.

Access tokens are short-lived; refresh tokens renew the pair. Both are HS256 JWTs.
"""
from __future__ import annotations

import uuid
from datetime import UTC, datetime, timedelta
from typing import Literal

import jwt

from core.settings import settings

TokenType = Literal["access", "refresh"]


class AuthError(Exception):
    pass


class InvalidToken(AuthError):
    pass


class ExpiredToken(AuthError):
    pass


def _now() -> datetime:
    return datetime.now(UTC)


def _create_token(
    *,
    user_id: uuid.UUID,
    tenant_id: uuid.UUID,
    role: str,
    token_type: TokenType,
    expires_in: timedelta,
) -> str:
    now = _now()
    payload = {
        "sub": str(user_id),
        "tenant_id": str(tenant_id),
        "role": role,
        "type": token_type,
        "iat": now,
        "exp": now + expires_in,
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def create_access_token(user_id: uuid.UUID, tenant_id: uuid.UUID, role: str) -> str:
    return _create_token(
        user_id=user_id,
        tenant_id=tenant_id,
        role=role,
        token_type="access",
        expires_in=timedelta(minutes=settings.jwt_access_ttl_minutes),
    )


def create_refresh_token(user_id: uuid.UUID, tenant_id: uuid.UUID, role: str) -> str:
    return _create_token(
        user_id=user_id,
        tenant_id=tenant_id,
        role=role,
        token_type="refresh",
        expires_in=timedelta(days=settings.jwt_refresh_ttl_days),
    )


def decode_token(token: str, *, expected: TokenType) -> dict:
    """Decode and validate a token. Raises InvalidToken / ExpiredToken."""
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret,
            algorithms=[settings.jwt_algorithm],
            options={"verify_exp": True},
        )
    except jwt.ExpiredSignatureError as exc:
        raise ExpiredToken("token expired") from exc
    except jwt.InvalidTokenError as exc:
        raise InvalidToken("invalid token") from exc

    if payload.get("type") != expected:
        raise InvalidToken("unexpected token type")
    if "sub" not in payload or "tenant_id" not in payload:
        raise InvalidToken("missing claims")
    return payload
