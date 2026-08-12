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
    is_guest: bool = False,
    extra: dict[str, str] | None = None,
) -> str:
    now = _now()
    payload: dict = {
        "sub": str(user_id),
        "tenant_id": str(tenant_id),
        "role": role,
        "type": token_type,
        "guest": is_guest,
        "iat": now,
        "exp": now + expires_in,
    }
    if extra:
        payload.update(extra)
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def create_access_token(
    user_id: uuid.UUID,
    tenant_id: uuid.UUID,
    role: str,
    *,
    is_guest: bool = False,
    extra: dict[str, str] | None = None,
) -> str:
    return _create_token(
        user_id=user_id,
        tenant_id=tenant_id,
        role=role,
        token_type="access",
        expires_in=timedelta(minutes=settings.guest_session_ttl_minutes if is_guest else settings.jwt_access_ttl_minutes),
        is_guest=is_guest,
        extra=extra,
    )


def create_refresh_token(
    user_id: uuid.UUID,
    tenant_id: uuid.UUID,
    role: str,
    *,
    is_guest: bool = False,
    extra: dict[str, str] | None = None,
) -> str:
    return _create_token(
        user_id=user_id,
        tenant_id=tenant_id,
        role=role,
        token_type="refresh",
        expires_in=timedelta(days=settings.jwt_refresh_ttl_days),
        is_guest=is_guest,
        extra=extra,
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
