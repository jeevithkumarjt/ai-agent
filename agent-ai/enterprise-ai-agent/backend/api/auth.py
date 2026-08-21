"""Auth routes: /v1/auth/login and /v1/auth/refresh (ADR-005)."""
from __future__ import annotations

import uuid
from typing import Annotated

from core.auth import (
    ExpiredToken,
    InvalidToken,
    create_access_token,
    create_refresh_token,
    decode_token,
)
from core.security import verify_password
from core.settings import settings
from db.models import User
from db.session import get_session
from fastapi import APIRouter, Depends, HTTPException, status
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
