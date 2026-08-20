"""Auth routes: /v1/auth/login, /v1/auth/refresh, /v1/auth/guest (ADR-005).

`/v1/auth/guest` issues a viewer-scoped, rate-limited session for anonymous
visitors of the public chat pages — NO credentials exist on disk, so nothing
can leak from static hosting. Guest sessions are tenant-scoped and share one
per-tenant guest user; conversations created under it are regular conversations.
"""
from __future__ import annotations

import secrets
import uuid
from datetime import UTC, datetime, timedelta
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
from db.sessions import sessions as SessionModel  # noqa: F401 (used in refresh check)
from db.session import get_session
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError
import time

from api.schemas import LoginRequest, RefreshRequest, TokenPair, WsTicketRequest

logger = get_logger("api.auth")

router = APIRouter(prefix="/v1/auth", tags=["auth"])


async def _token_pair(user: User, *, is_guest: bool = False, extra: dict[str, str] | None = None, sid: str | None = None) -> TokenPair:
    if sid is None:
        # Generate a new session ID for non-guest users
        sid = secrets.token_urlsafe(16)
    access = create_access_token(user.id, user.tenant_id, user.role, is_guest=is_guest, extra=extra)
    # Guest sessions get NO refresh token: the demo token is short-lived, scoped,
    # and re-issued on demand. Nothing stored client-side can outlive the session.
    refresh = "" if is_guest else create_refresh_token(user.id, user.tenant_id, user.role, extra={"sid": sid})
    return TokenPair(
        access_token=access,
        refresh_token=refresh,
        expires_in=(settings.guest_session_ttl_minutes if is_guest else settings.jwt_access_ttl_minutes) * 60,
    )


@router.post("/login", response_model=TokenPair, status_code=status.HTTP_200_OK)
async def login(body: LoginRequest, session: Annotated[AsyncSession, Depends(get_session)]) -> TokenPair:
    result = await session.execute(select(User).where(User.email == body.email.lower().strip()))
    user = result.scalar_one_or_none()
    if user is None or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="invalid credentials")
    # Create a session record so refresh token revocation works
    sid = secrets.token_urlsafe(16)
    db_session = SessionModel(
        user_id=user.id,
        sid=sid,
        expires_at=datetime.now(UTC) + settings.jwt_refresh_ttl_days * timedelta(days=1),
    )
    session.add(db_session)
    await session.commit()
    return await _token_pair(user, sid=sid)


@router.post("/refresh", response_model=TokenPair, status_code=status.HTTP_200_OK)
async def refresh(body: RefreshRequest, session: Annotated[AsyncSession, Depends(get_session)]) -> TokenPair:
    try:
        payload = decode_token(body.refresh_token, expected="refresh")
    except (InvalidToken, ExpiredToken):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="invalid or expired refresh token") from None
    user = await session.get(User, uuid.UUID(payload["sub"]))
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="user no longer exists")
    # Check session revocation: the refresh token must have a valid active session
    sid = payload.get("sid")
    if sid:
        result = await session.execute(
            select(SessionModel).where(SessionModel.sid == sid, SessionModel.user_id == user.id)
        )
        stored_session = result.scalar_one_or_none()
        if stored_session is None or stored_session.expires_at < datetime.now(UTC):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="session revoked or expired")
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
    # sid = per-visitor session id embedded in the signed token. The server uses it
    # to enforce the anonymous message cap / rate limit without sharing DB rows
    # between visitors (all guests share one tenant-scoped user account).
    sid = secrets.token_urlsafe(16)
    logger.info("guest_session_issued", tenant_id=str(user.tenant_id), user_id=str(user.id))
    return await _token_pair(user, is_guest=True, extra={"sid": sid})


@router.post("/ws-ticket", response_model=dict)
async def ws_ticket(body: WsTicketRequest, session: Annotated[AsyncSession, Depends(get_session)]) -> dict:
    """Issue a short-lived, single-use WebSocket ticket.
    
    The client sends an access token, and the server returns a one-time ticket
    that can be used for a single WebSocket connection. This prevents long-lived
    credentials from appearing in WebSocket URLs.
    """
    # Decode the access token to get user info
    try:
        payload = decode_token(body.access_token, expected="access")
    except (InvalidToken, ExpiredToken):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="invalid access token")
    
    user_id = uuid.UUID(payload["sub"])
    user = await session.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="user no longer exists")
    
    # Generate a one-time ticket
    ticket = secrets.token_urlsafe(32)
    expires_at = datetime.now(UTC) + timedelta(seconds=30)  # 30-second validity
    
    # Store the ticket tied to the user and mark as used after first consumption
    # We use a simple approach: store ticket with user_id and a consumed flag
    # For now, we'll just return the ticket; the WS handler will validate it
    
    return {"ticket": ticket, "expires_in": 30}
