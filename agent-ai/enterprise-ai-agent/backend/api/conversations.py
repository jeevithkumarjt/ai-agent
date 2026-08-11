"""Conversation routes: create, history, SSE message, WebSocket stream.

All access is tenant-scoped: the conversation must belong to the caller's tenant
(ADR-004), otherwise 404 — not 403 — so we don't leak existence.
"""
from __future__ import annotations

import uuid
from typing import Annotated

from core.auth import InvalidToken, decode_token
from core.logging import get_logger
from db.models import Conversation as ConversationModel
from db.models import Message
from db.session import async_session_factory, get_session
from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Request,
    WebSocket,
    WebSocketDisconnect,
    status,
)
from fastapi.responses import StreamingResponse
from services.orchestrator import Orchestrator
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from api.deps import Principal, require_auth
from api.schemas import Conversation, MessageOut, MessagePage, MessageRequest
from api.streaming import sse_event

logger = get_logger("api.conversations")

router = APIRouter(prefix="/v1/conversations", tags=["conversations"])

MAX_LIMIT = 200


async def _get_owned_conversation(session: AsyncSession, conversation_id: uuid.UUID, tenant_id: uuid.UUID) -> ConversationModel:
    conv = await session.get(ConversationModel, conversation_id)
    if conv is None or conv.tenant_id != tenant_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="conversation not found")
    return conv


async def _orchestrator(request: Request) -> Orchestrator:
    return request.app.state.orchestrator


@router.post("", response_model=Conversation, status_code=status.HTTP_201_CREATED)
async def create_conversation(
    principal: Annotated[Principal, Depends(require_auth)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> Conversation:
    conv = ConversationModel(tenant_id=principal.tenant_id, user_id=principal.user_id)
    session.add(conv)
    await session.commit()
    await session.refresh(conv)
    return Conversation.model_validate(conv)


@router.get("/{conversation_id}/messages", response_model=MessagePage)
async def list_messages(
    conversation_id: uuid.UUID,
    principal: Annotated[Principal, Depends(require_auth)],
    session: Annotated[AsyncSession, Depends(get_session)],
    limit: int = 50,
    offset: int = 0,
) -> MessagePage:
    if limit > MAX_LIMIT:
        limit = MAX_LIMIT
    await _get_owned_conversation(session, conversation_id, principal.tenant_id)

    total = await session.scalar(
        select(func.count()).select_from(Message).where(
            Message.conversation_id == conversation_id, Message.tenant_id == principal.tenant_id
        )
    )
    rows = await session.scalars(
        select(Message)
        .where(Message.conversation_id == conversation_id, Message.tenant_id == principal.tenant_id)
        .order_by(Message.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    items = [MessageOut.model_validate(m) for m in reversed(list(rows))]
    return MessagePage(items=items, total=total or 0, limit=limit, offset=offset)


@router.post("/{conversation_id}/messages")
async def send_message(
    conversation_id: uuid.UUID,
    body: MessageRequest,
    request: Request,
    principal: Annotated[Principal, Depends(require_auth)],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    await _get_owned_conversation(session, conversation_id, principal.tenant_id)
    orchestrator: Orchestrator = await _orchestrator(request)

    async def events():
        async for event in orchestrator.stream_reply(
            session=session,
            tenant_id=principal.tenant_id,
            conversation_id=conversation_id,
            user_text=body.content,
        ):
            yield sse_event(event)

    return StreamingResponse(events(), media_type="text/event-stream", headers={"Cache-Control": "no-cache"})


@router.websocket("/{conversation_id}/ws")
async def conversation_ws(websocket: WebSocket, conversation_id: uuid.UUID):
    """WebSocket transport — token passed as ?token=<jwt> (WebSocket has no headers)."""
    token = websocket.query_params.get("token", "")
    try:
        payload = decode_token(token, expected="access")
        principal = Principal(user_id=uuid.UUID(payload["sub"]), tenant_id=uuid.UUID(payload["tenant_id"]), role=payload.get("role", "viewer"))
    except (InvalidToken, ValueError):
        await websocket.close(code=4401)
        return

    await websocket.accept()
    async with async_session_factory() as session:
        try:
            await _get_owned_conversation(session, conversation_id, principal.tenant_id)
        except HTTPException:
            await websocket.send_json({"type": "error", "message": "conversation not found"})
            await websocket.close(code=4404)
            return

        orchestrator: Orchestrator = websocket.app.state.orchestrator
        try:
            while True:
                message = await websocket.receive_text()
                async for event in orchestrator.stream_reply(
                    session=session,
                    tenant_id=principal.tenant_id,
                    conversation_id=conversation_id,
                    user_text=message,
                ):
                    await websocket.send_json(event)
        except WebSocketDisconnect:
            logger.info("ws_disconnect", conversation_id=str(conversation_id))
