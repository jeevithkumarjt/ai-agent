"""Admin unanswered-questions routes: triage, answer, approve (+ auto knowledge add)."""
from __future__ import annotations

import uuid
from typing import Annotated

from core.rbac import (
    SCOPE_UNANSWERED_APPROVE,
    SCOPE_UNANSWERED_VIEW,
    SCOPE_UNANSWERED_WRITE,
    has_scope,
)
from db.session import get_session
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from services.portal import PortalService
from sqlalchemy.ext.asyncio import AsyncSession

from api.admin.deps import Principal, portal, require_scope

router = APIRouter(prefix="/unanswered", tags=["admin-unanswered"])

ANSWER_STATUSES = {"answered", "approved", "dismissed"}


class AnswerBody(BaseModel):
    answer: str = Field(min_length=1)
    status: str = "answered"


def _needed_scope(body: AnswerBody) -> str:
    return SCOPE_UNANSWERED_APPROVE if body.status == "approved" else SCOPE_UNANSWERED_WRITE


@router.get("")
async def list_unanswered(
    principal: Annotated[Principal, Depends(require_scope(SCOPE_UNANSWERED_VIEW))],
    portal_service: Annotated[PortalService, Depends(portal)],
    session: Annotated[AsyncSession, Depends(get_session)],
    q: str = "",
    uq_status: str = "",
    limit: int = 200,
    offset: int = 0,
) -> dict:
    return await portal_service.list_unanswered(session, principal.tenant_id, status=uq_status, q=q, limit=limit, offset=offset)


@router.post("/{question_id}/answer")
async def answer_question(
    question_id: uuid.UUID,
    body: AnswerBody,
    principal: Annotated[Principal, Depends(require_scope(SCOPE_UNANSWERED_WRITE))],
    portal_service: Annotated[PortalService, Depends(portal)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> dict:
    if body.status not in ANSWER_STATUSES:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=f"status must be one of {sorted(ANSWER_STATUSES)}")
    if not has_scope(principal.role, _needed_scope(body)):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="role lacks permission for this action")
    try:
        return await portal_service.answer_unanswered(session, principal.tenant_id, str(question_id), answer=body.answer, status=body.status, by=principal.user_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
