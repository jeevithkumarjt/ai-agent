"""Auth routes: /v1/auth/login, /v1/auth/refresh, /v1/auth/guest (ADR-005).

`/v1/auth/guest` issues a short-lived viewer token for anonymous visitors.
"""
from __future__ import annotations

import secrets
import uuid
from typing import Annotated

from core.auth import (
    ExpiredToken,
    InvalidToken,
    create_access_token,
    create_refresh_token,
    decode_token,
)
from core.security import hash_password, verify_password
from core.settings import settings
from db.models import Tenant, User
from db.session import get_session
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from api.schemas import LoginRequest, RefreshRequest, TokenPair

router = APIRouter(prefix="/v1/auth", tags=["auth"])


async def _token_pair(user: User) -> TokenPair:
    access = create_access_token(user.id, user.tenant_id, user.role)
    refresh = create_refresh_token(user.id, user.tenant_id, user.role)
    return TokenPair(
        access_token=access,
        refresh_token=refresh,
        expires_in=settings.jwt_access_ttl_minutes * 60,
    )


@router.post("/login", response_model=TokenPair, status_code=status.HTTP_200_OK)
async def login(body: LoginRequest, session: Annotated[AsyncSession, Depends(get_session)]) -> TokenPair:
    result = await session.execute(select(User).where(User.email == body.email.lower().strip()))
    user = result.scalar_one_or_none()
    if user is None or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="invalid credentials")
    return await _token_pair(user)


@router.post("/refresh", response_model=TokenPair, status_code=status.HTTP_200_OK)
async def refresh(body: RefreshRequest, session: Annotated[AsyncSession, Depends(get_session)]) -> TokenPair:
    try:
        payload = decode_token(body.refresh_token, expected="refresh")
    except (InvalidToken, ExpiredToken):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="invalid or expired refresh token") from None
    user = await session.get(User, uuid.UUID(payload["sub"]))
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="user no longer exists")
    return await _token_pair(user)


@router.post("/guest", response_model=TokenPair, status_code=status.HTTP_200_OK)
async def guest(request: Request, session: Annotated[AsyncSession, Depends(get_session)]) -> TokenPair:
    """Issue a short-lived viewer token for anonymous visitors (no credentials required)."""
    tenant = (await session.execute(select(Tenant).limit(1))).scalar_one_or_none()
    if tenant is None:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="no tenant configured")
    guest_email = f"guest-{secrets.token_hex(8)}@anon.local"
    user = User(
        tenant_id=tenant.id,
        email=guest_email,
        role=settings.guest_role,
        password_hash=hash_password(secrets.token_urlsafe(16)),
    )
    session.add(user)
    await session.commit()
    access = create_access_token(user.id, user.tenant_id, user.role)
    return TokenPair(
        access_token=access,
        refresh_token="",
        expires_in=settings.guest_session_ttl_minutes * 60,
    )
