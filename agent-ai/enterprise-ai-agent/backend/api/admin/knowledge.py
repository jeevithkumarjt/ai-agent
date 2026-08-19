"""Admin knowledge management routes: browse, upload, edit, delete, versions,
rollback, manual docs, retrain/sync, jobs, status.

IMPORTANT — Seed docs vs real tenant ingestion:
- `documents/doc/*.docx` committed to repo = demo content for the Tryvium tenant only
- Real customers upload their knowledge base through the admin portal → DB/object storage
- The admin portal upload path (POST /knowledge/upload, handled by portal_service.prepare_uploads)
  is the actual production route for customer docs
- Multi-tenant SaaS should NEVER require a code commit to onboard a customer's content
- Future contributors: never add customer KB files to repo; always use the admin upload API
"""

import uuid
from typing import Annotated

from core.logging import get_logger
from core.rbac import SCOPE_KNOWLEDGE_TRAIN, SCOPE_KNOWLEDGE_VIEW, SCOPE_KNOWLEDGE_WRITE
from db.session import get_session
from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile, status
from pydantic import BaseModel, Field
from services.portal import PortalService
from sqlalchemy.ext.asyncio import AsyncSession

from api.admin.deps import Principal, portal, require_scope

logger = get_logger("api.admin.knowledge")

router = APIRouter(prefix="/knowledge", tags=["admin-knowledge"])


class EditDocBody(BaseModel):
    content: str = Field(min_length=1)
    title: str = ""
    reason: str = ""


class RollbackBody(BaseModel):
    version: int = Field(gt=0)


class ManualDocBody(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    content: str = Field(min_length=1)


@router.get("")
async def list_documents(
    principal: Annotated[Principal, Depends(require_scope(SCOPE_KNOWLEDGE_VIEW))],
    portal_service: Annotated[PortalService, Depends(portal)],
    session: Annotated[AsyncSession, Depends(get_session)],
    q: str = "",
    doc_status: str = "",
    limit: int = 200,
    offset: int = 0,
) -> dict:
    return await portal_service.list_documents(session, principal.tenant_id, q=q, status=doc_status, limit=limit, offset=offset)


@router.get("/status")
async def knowledge_status(
    principal: Annotated[Principal, Depends(require_scope(SCOPE_KNOWLEDGE_VIEW))],
    portal_service: Annotated[PortalService, Depends(portal)],
) -> dict:
    return portal_service.knowledge.status()


@router.get("/jobs")
async def list_jobs(
    principal: Annotated[Principal, Depends(require_scope(SCOPE_KNOWLEDGE_VIEW))],
    portal_service: Annotated[PortalService, Depends(portal)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> dict:
    return await portal_service.list_jobs(session, principal.tenant_id)


@router.get("/{document_id}")
async def get_document(
    document_id: uuid.UUID,
    principal: Annotated[Principal, Depends(require_scope(SCOPE_KNOWLEDGE_VIEW))],
    portal_service: Annotated[PortalService, Depends(portal)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> dict:
    try:
        doc = await portal_service.get_document(session, principal.tenant_id, str(document_id))
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    return portal_service._doc_payload(doc)


@router.get("/{document_id}/versions")
async def document_versions(
    document_id: uuid.UUID,
    principal: Annotated[Principal, Depends(require_scope(SCOPE_KNOWLEDGE_VIEW))],
    portal_service: Annotated[PortalService, Depends(portal)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> list[dict]:
    return await portal_service.document_versions(session, principal.tenant_id, str(document_id))


@router.post("/{document_id}/edit")
async def edit_document(
    document_id: uuid.UUID,
    body: EditDocBody,
    principal: Annotated[Principal, Depends(require_scope(SCOPE_KNOWLEDGE_WRITE))],
    portal_service: Annotated[PortalService, Depends(portal)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> dict:
    try:
        return await portal_service.edit_document(session, principal.tenant_id, str(document_id), content=body.content, title=body.title, reason=body.reason, by=principal.user_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.post("/{document_id}/delete")
async def delete_document(
    document_id: uuid.UUID,
    principal: Annotated[Principal, Depends(require_scope(SCOPE_KNOWLEDGE_WRITE))],
    portal_service: Annotated[PortalService, Depends(portal)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> dict:
    try:
        return await portal_service.delete_document(session, principal.tenant_id, str(document_id), by=principal.user_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.post("/{document_id}/rollback")
async def rollback_document(
    document_id: uuid.UUID,
    body: RollbackBody,
    principal: Annotated[Principal, Depends(require_scope(SCOPE_KNOWLEDGE_WRITE))],
    portal_service: Annotated[PortalService, Depends(portal)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> dict:
    try:
        return await portal_service.rollback_document(session, principal.tenant_id, str(document_id), body.version, by=principal.user_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.post("/manual")
async def add_manual_document(
    body: ManualDocBody,
    principal: Annotated[Principal, Depends(require_scope(SCOPE_KNOWLEDGE_WRITE))],
    portal_service: Annotated[PortalService, Depends(portal)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> dict:
    return await portal_service.add_manual_document(session, principal.tenant_id, title=body.title, content=body.content, by=principal.user_id)


@router.post("/upload")
async def upload_knowledge(
    request: Request,
    principal: Annotated[Principal, Depends(require_scope(SCOPE_KNOWLEDGE_WRITE))],
    portal_service: Annotated[PortalService, Depends(portal)],
    session: Annotated[AsyncSession, Depends(get_session)],
    files: list[UploadFile],
) -> dict:
    return await portal_service.prepare_uploads(session, principal.tenant_id, files, by=principal.user_id)


@router.post("/retrain")
async def retrain(
    principal: Annotated[Principal, Depends(require_scope(SCOPE_KNOWLEDGE_TRAIN))],
    portal_service: Annotated[PortalService, Depends(portal)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> dict:
    return await portal_service.rebuild_index(session, principal.tenant_id, by=principal.user_id)


@router.post("/sync")
async def sync(
    principal: Annotated[Principal, Depends(require_scope(SCOPE_KNOWLEDGE_TRAIN))],
    portal_service: Annotated[PortalService, Depends(portal)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> dict:
    return await portal_service.sync_sites(session, principal.tenant_id, by=principal.user_id)
