"""Shared admin-portal dependencies: scope guards + service accessor.

Extends the core ``Principal`` with the user's email (needed for audit logs and
deactivation checks) and enforces the RBAC scope matrix + disabled accounts."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Annotated

from core.logging import get_logger
from core.rbac import has_scope
from db.models import User
from db.session import get_session
from fastapi import Depends, HTTPException, Request, status
from services.portal import PortalService
from sqlalchemy.ext.asyncio import AsyncSession

from api.deps import Principal as CorePrincipal
from api.deps import require_auth as core_require_auth

logger = get_logger("api.admin.deps")


@dataclass(frozen=True)
class Principal:
    user_id: object
    tenant_id: object
    role: str
    email: str


def portal(request: Request) -> PortalService:
    return request.app.state.portal


def require_scope(scope: str):
    """Factory that returns a FastAPI dependency enforcing an RBAC scope."""

    async def dependency(
        core_principal: Annotated[CorePrincipal, Depends(core_require_auth)],
        portal_service: Annotated[PortalService, Depends(portal)],
        session: Annotated[AsyncSession, Depends(get_session)],
    ) -> Principal:
        user = await session.get(User, core_principal.user_id)
        email = user.email if user is not None else ""
        if user is None or user.tenant_id != core_principal.tenant_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="account no longer exists")
        role = user.role
        disabled = portal_service.get_setting(core_principal.tenant_id, "disabled_users", []) or []
        if email in disabled:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="account deactivated")
        if not has_scope(role, scope):
            logger.info("admin_forbidden", user_id=str(core_principal.user_id), role=role, scope=scope)
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"role '{role}' lacks permission: {scope}",
            )
        return Principal(
            user_id=core_principal.user_id,
            tenant_id=core_principal.tenant_id,
            role=role,
            email=email,
        )

    return dependency


__all__ = ["Principal", "portal", "require_scope"]
