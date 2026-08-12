"""Admin system routes: health, audit, notifications, settings, API keys,
backup/restore, train jobs, and conversation export."""
from __future__ import annotations

from typing import Annotated

from core.rbac import (
    SCOPE_AUDIT,
    SCOPE_BACKUP,
    SCOPE_HEALTH,
    SCOPE_NOTIFICATIONS,
    SCOPE_SETTINGS_MANAGE,
    SCOPE_SETTINGS_VIEW,
)
from db.session import get_session
from fastapi import APIRouter, Depends, HTTPException, UploadFile, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from services.portal import PortalService
from sqlalchemy.ext.asyncio import AsyncSession

from api.admin.deps import Principal, portal, require_scope

router = APIRouter(tags=["admin-system"])


class NotificationsReadBody(BaseModel):
    ids: list[str] | None = None


class SettingsBody(BaseModel):
    retrieval_top_k: int | None = None
    system_prompt_override: str | None = None
    knowledge_sites: list[str] | None = None
    knowledge_max_site_pages: int | None = None
    auto_sync_minutes: int | None = None
    agent_model: str | None = None
    embedding_model: str | None = None


class ApiKeyBody(BaseModel):
    name: str


# -- me ----------------------------------------------------------------------

@router.get("/me")
async def me(
    principal: Annotated[Principal, Depends(require_scope(SCOPE_HEALTH))],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> dict:
    from core.rbac import role_label, role_scopes
    from db.models import Tenant
    tenant = await session.get(Tenant, principal.tenant_id)
    return {
        "user_id": str(principal.user_id),
        "email": principal.email,
        "role": principal.role,
        "role_label": role_label(principal.role),
        "tenant_name": tenant.name if tenant is not None else "",
        "scopes": sorted(role_scopes(principal.role)),
    }


# -- health ------------------------------------------------------------------

@router.get("/health")
async def health(
    principal: Annotated[Principal, Depends(require_scope(SCOPE_HEALTH))],
    portal_service: Annotated[PortalService, Depends(portal)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> dict:
    return await portal_service.health(session, principal.tenant_id)


# -- audit -------------------------------------------------------------------

@router.get("/audit")
async def audit_log(
    principal: Annotated[Principal, Depends(require_scope(SCOPE_AUDIT))],
    portal_service: Annotated[PortalService, Depends(portal)],
    session: Annotated[AsyncSession, Depends(get_session)],
    action: str = "",
    limit: int = 200,
    offset: int = 0,
) -> dict:
    return await portal_service.list_audit(session, principal.tenant_id, action=action, limit=limit, offset=offset)


# -- notifications -----------------------------------------------------------

@router.get("/notifications")
async def notifications(
    principal: Annotated[Principal, Depends(require_scope(SCOPE_NOTIFICATIONS))],
    portal_service: Annotated[PortalService, Depends(portal)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> dict:
    return await portal_service.list_notifications(session, principal.tenant_id)


@router.post("/notifications/read")
async def notifications_read(
    body: NotificationsReadBody,
    principal: Annotated[Principal, Depends(require_scope(SCOPE_NOTIFICATIONS))],
    portal_service: Annotated[PortalService, Depends(portal)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> dict:
    await portal_service.mark_notifications_read(session, principal.tenant_id, body.ids)
    return {"ok": True}


# -- settings ----------------------------------------------------------------

@router.get("/settings")
async def get_settings(
    principal: Annotated[Principal, Depends(require_scope(SCOPE_SETTINGS_VIEW))],
    portal_service: Annotated[PortalService, Depends(portal)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> dict:
    return await portal_service.load_settings(session, principal.tenant_id)


@router.put("/settings")
async def update_settings(
    body: SettingsBody,
    principal: Annotated[Principal, Depends(require_scope(SCOPE_SETTINGS_MANAGE))],
    portal_service: Annotated[PortalService, Depends(portal)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> dict:
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    result = await portal_service.set_settings(session, principal.tenant_id, updates, principal.user_id)
    await portal_service.audit(session, principal.tenant_id, principal.user_id, "settings.update", "settings", "",
                               detail={k: v for k, v in updates.items() if k != "api_keys"})
    await portal_service.notify(session, principal.tenant_id, "info", "Settings updated", "Admin settings were changed.")
    return result


# -- API keys ----------------------------------------------------------------

@router.get("/api-keys")
async def list_api_keys(
    principal: Annotated[Principal, Depends(require_scope(SCOPE_SETTINGS_VIEW))],
    portal_service: Annotated[PortalService, Depends(portal)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> list[dict]:
    return await portal_service.list_api_keys(session, principal.tenant_id)


@router.post("/api-keys")
async def create_api_key(
    body: ApiKeyBody,
    principal: Annotated[Principal, Depends(require_scope(SCOPE_SETTINGS_MANAGE))],
    portal_service: Annotated[PortalService, Depends(portal)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> dict:
    return await portal_service.create_api_key(session, principal.tenant_id, body.name, principal.user_id)


@router.delete("/api-keys/{index}")
async def delete_api_key(
    index: int,
    principal: Annotated[Principal, Depends(require_scope(SCOPE_SETTINGS_MANAGE))],
    portal_service: Annotated[PortalService, Depends(portal)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> dict:
    return await portal_service.delete_api_key(session, principal.tenant_id, index, principal.user_id)


# -- backup ------------------------------------------------------------------

@router.get("/backup")
async def export_backup(
    principal: Annotated[Principal, Depends(require_scope(SCOPE_BACKUP))],
    portal_service: Annotated[PortalService, Depends(portal)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> StreamingResponse:
    buffer = await portal_service.export_backup(session, principal.tenant_id)
    return StreamingResponse(
        buffer, media_type="application/zip",
        headers={"Content-Disposition": 'attachment; filename="knowledge-backup.zip"'},
    )


@router.post("/backup/restore")
async def restore_backup(
    file: UploadFile,
    principal: Annotated[Principal, Depends(require_scope(SCOPE_BACKUP))],
    portal_service: Annotated[PortalService, Depends(portal)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> dict:
    data = await file.read()
    try:
        return await portal_service.restore_backup(session, principal.tenant_id, data, by=principal.user_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.get("/export-conversations")
async def export_conversations(
    principal: Annotated[Principal, Depends(require_scope(SCOPE_BACKUP))],
    portal_service: Annotated[PortalService, Depends(portal)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> StreamingResponse:
    csv_text = await portal_service.export_conversations_csv(session, principal.tenant_id)
    return StreamingResponse(
        iter([csv_text]), media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="conversations.csv"'},
    )


# -- jobs --------------------------------------------------------------------

@router.get("/jobs")
async def list_jobs(
    principal: Annotated[Principal, Depends(require_scope(SCOPE_HEALTH))],
    portal_service: Annotated[PortalService, Depends(portal)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> dict:
    return await portal_service.list_jobs(session, principal.tenant_id)
