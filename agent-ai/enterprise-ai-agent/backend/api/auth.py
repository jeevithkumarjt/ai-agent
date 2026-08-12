"""Auth routes: /v1/auth/login, /v1/auth/refresh, /v1/auth/guest (ADR-005).

`/v1/auth/guest` issues a viewer-scoped, rate-limited session for anonymous
visitors of the public chat pages — NO credentials exist on disk, so nothing
can leak from static hosting. Guest sessions are tenant-scoped and share one
per-tenant guest user; conversations created under it are regular conversations.
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
from core.logging import get_logger
from core.security import hash_password, verify_password
from core.settings import settings
from db.models import Tenant, User
from db.session import get_session
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from api.schemas import LoginRequest, RefreshRequest, TokenPair

logger = get_logger("api.auth")

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


async def _guest_user(session: AsyncSession) -> User:
    """Resolve the tenant (explicit setting, else first) and find-or-create a
    shared guest user scoped to it. The guest's password is a random value that
    is never stored anywhere client-side, so it can never be used to log in."""
    if settings.guest_tenant_id:
        tenant_id = uuid.UUID(settings.guest_tenant_id)
    else:
        tenant_id = await session.scalar(select(Tenant.id).order_by(Tenant.created_at).limit(1))
    if tenant_id is None:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="no tenant configured for guest sessions")

    email = f"guest@{tenant_id}.local"
    user = await session.scalar(select(User).where(User.tenant_id == tenant_id, User.email == email))
    if user is None:
        user = User(
            tenant_id=tenant_id,
            email=email,
            role=settings.guest_role or "viewer",
            password_hash=hash_password(secrets.token_urlsafe(32)),
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)
        logger.info("guest_user_created", tenant_id=str(tenant_id), user_id=str(user.id))
    return user


@router.post("/guest", response_model=TokenPair, status_code=status.HTTP_200_OK)
async def guest_session(request: Request, session: Annotated[AsyncSession, Depends(get_session)]) -> TokenPair:
    if not settings.guest_enabled:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="guest sessions are disabled")
    user = await _guest_user(session)
    logger.info("guest_session_issued", tenant_id=str(user.tenant_id), user_id=str(user.id))
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
