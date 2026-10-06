"""Tenant signup and management routes (ADR-024).

Endpoints:
- POST /v1/tenants/signup  — self-serve: create tenant + first admin + issue token
- GET  /v1/tenants         — list tenants (admin only)
"""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import Annotated, Any, Dict

from core.auth import create_access_token, create_refresh_token
from core.logging import get_logger
from core.security import hash_password
from core.settings import settings
from db.models import Tenant, User
from db.session import get_session
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError

from api.schemas import (
    TenantSignupRequest,
    TenantSignupResponse,
    TenantListItem,
)

logger = get_logger("api.tenant")

router = APIRouter(prefix="/v1/tenants", tags=["tenants"])


@router.post("/signup", response_model=TenantSignupResponse, status_code=status.HTTP_201_CREATED)
async def signup(body: TenantSignupRequest, session: Annotated[AsyncSession, Depends(get_session)]) -> TenantSignupResponse:
    """Self-serve: create a new tenant, first admin user, and issue token pair.

    This wraps the existing ``seed`` logic so customers can start themselves
    without running ``cli.py seed`` manually.
    """
    # Check if tenant already exists with this email
    existing = await session.scalar(
        select(User).where(User.email == body.owner_email.lower().strip())
    )
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists",
        )

    # Create the tenant
    tenant = Tenant(name=body.tenant_name)
    session.add(tenant)
    await session.flush()  # generate tenant.id before commit

    # Create the first admin user
    user = User(
        tenant_id=tenant.id,
        email=body.owner_email.lower().strip(),
        role="owner",
        password_hash=hash_password(body.owner_password),
    )
    session.add(user)
    await session.commit()

    # Issue token pair for the new owner
    access = create_access_token(user.id, user.tenant_id, user.role)
    refresh = create_refresh_token(user.id, user.tenant_id, user.role)

    logger.info("tenant_signup_success", tenant_id=str(tenant.id), owner=body.owner_email)

    return TenantSignupResponse(
        tenant_id=str(tenant.id),
        owner_email=user.email,
        access_token=access,
        refresh_token=refresh,
        expires_in=settings.jwt_access_ttl_minutes * 60,
    )


@router.get("", response_model=Dict[str, Any], status_code=status.HTTP_200_OK)
async def list_tenants(
    session: Annotated[AsyncSession, Depends(get_session)],
) -> Dict[str, Any]:
    """List all tenants with basic info (admin only)."""
    total = await session.scalar(select(func.count()).select_from(Tenant))
    tenants = (await session.execute(select(Tenant))).scalars().all()

    result = []
    for t in tenants:
        user_count = await session.scalar(
            select(func.count()).select_from(User).where(User.tenant_id == t.id)
        )
        result.append(
            {
                "id": str(t.id),
                "name": t.name,
                "created_at": str(t.created_at),
                "user_count": int(user_count or 0),
            }
        )

    return {"tenants": result, "total": total}