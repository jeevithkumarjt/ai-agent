"""Admin user management routes: list, invite, role change, deactivate, activity."""
from __future__ import annotations

import secrets
import uuid
from typing import Annotated

from core.rbac import SCOPE_USERS_MANAGE, SCOPE_USERS_VIEW, role_label
from core.security import hash_password
from db.admin_models import AuditLog
from db.models import User
from db.session import get_session
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from services.portal import PortalService
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from api.admin.deps import Principal, portal, require_scope

router = APIRouter(prefix="/users", tags=["admin-users"])

VALID_ROLES = {"owner", "admin", "editor", "viewer"}


class InviteBody(BaseModel):
    email: str = Field(min_length=3)
    role: str = "viewer"


class UpdateUserBody(BaseModel):
    role: str | None = None
    deactivated: bool | None = None


@router.get("")
async def list_users(
    principal: Annotated[Principal, Depends(require_scope(SCOPE_USERS_VIEW))],
    portal_service: Annotated[PortalService, Depends(portal)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> dict:
    rows = (await session.scalars(
        select(User).where(User.tenant_id == principal.tenant_id).order_by(User.created_at)
    )).all()
    settings = await portal_service.load_settings(session, principal.tenant_id)
    disabled = set(settings.get("disabled_users", []))
    items = []
    for user in rows:
        items.append({
            "id": str(user.id), "email": user.email, "role": user.role,
            "role_label": role_label(user.role), "deactivated": user.email in disabled,
            "created_at": str(user.created_at),
        })
    return {"items": items, "total": len(items)}


@router.post("/invite")
async def invite_user(
    body: InviteBody,
    principal: Annotated[Principal, Depends(require_scope(SCOPE_USERS_MANAGE))],
    portal_service: Annotated[PortalService, Depends(portal)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> dict:
    if body.role not in VALID_ROLES:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=f"role must be one of {sorted(VALID_ROLES)}")
    existing = await session.scalar(select(User).where(User.tenant_id == principal.tenant_id, User.email == body.email))
    if existing is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="user already exists")
    temp_password = secrets.token_urlsafe(9) + "Aa1!"
    user = User(tenant_id=principal.tenant_id, email=body.email, role=body.role, password_hash=hash_password(temp_password))
    session.add(user)
    await session.commit()
    await session.refresh(user)
    await portal_service.audit(session, principal.tenant_id, principal.user_id, "users.invite", "users", str(user.id),
                               detail={"email": body.email, "role": body.role})
    await portal_service.notify(session, principal.tenant_id, "info", "User invited", f"{body.email} was added as {role_label(body.role)}.")
    return {"id": str(user.id), "email": body.email, "role": body.role, "temporary_password": temp_password}


@router.patch("/{user_id}")
async def update_user(
    user_id: uuid.UUID,
    body: UpdateUserBody,
    principal: Annotated[Principal, Depends(require_scope(SCOPE_USERS_MANAGE))],
    portal_service: Annotated[PortalService, Depends(portal)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> dict:
    user = await session.get(User, user_id)
    if user is None or user.tenant_id != principal.tenant_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="user not found")
    if user.id == principal.user_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="cannot modify your own account")
    if body.role is not None:
        if body.role not in VALID_ROLES:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=f"role must be one of {sorted(VALID_ROLES)}")
        old = user.role
        user.role = body.role
        await portal_service.audit(session, principal.tenant_id, principal.user_id, "users.role_change", "users", str(user.id),
                                   detail={"email": user.email, "from": old, "to": body.role})
    if body.deactivated is not None:
        settings = await portal_service.load_settings(session, principal.tenant_id)
        disabled = set(settings.get("disabled_users", []))
        if body.deactivated:
            disabled.add(user.email)
        else:
            disabled.discard(user.email)
        await portal_service.set_settings(session, principal.tenant_id, {"disabled_users": sorted(disabled)}, principal.user_id)
        await portal_service.audit(session, principal.tenant_id, principal.user_id, "users.deactivate" if body.deactivated else "users.activate",
                                   "users", str(user.id), detail={"email": user.email})
    await session.commit()
    return {"ok": True, "email": user.email, "role": user.role, "deactivated": body.deactivated or False}


@router.get("/activity")
async def user_activity(
    principal: Annotated[Principal, Depends(require_scope(SCOPE_USERS_VIEW))],
    portal_service: Annotated[PortalService, Depends(portal)],
    session: Annotated[AsyncSession, Depends(get_session)],
    limit: int = 50,
) -> dict:
    rows = (await session.scalars(
        select(AuditLog).where(AuditLog.tenant_id == principal.tenant_id).order_by(AuditLog.created_at.desc()).limit(limit)
    )).all()
    return {"items": [
        {"id": str(r.id), "email": r.email, "action": r.action, "detail": r.detail, "created_at": str(r.created_at)} for r in rows
    ]}
