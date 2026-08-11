from __future__ import annotations

import json
import uuid

from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse

from application.pipeline.query_pipeline import QueryContext
from config import settings
from container import Container
from domain.schemas.chat import (
    AnswerRequest,
    ChatAnswer,
    FeedbackCreate,
    MessageOut,
    SessionCreate,
    SessionOut,
    SessionPatch,
    StreamRequest,
)
from domain.schemas.common import Paginated
from infrastructure.security.rate_limit import check_rate_limit, rate_key
from interfaces.api.deps import ContainerDep, SessionDep, UserDep

router = APIRouter(prefix="/chat", tags=["chat"])


def _sse(event: str, data: dict) -> str:
    return f"event: {event}\ndata: {json.dumps(data)}\n\n"


@router.post("/sessions", response_model=SessionOut)
async def create_session(
    data: SessionCreate, session: SessionDep, container: ContainerDep, user: UserDep
) -> SessionOut:
    from domain.models import Conversation

    chat = container.make_chat(session)
    conv = Conversation(tenant_id=user.tenant_id, user_id=user.id, title=data.title)
    session.add(conv)
    await session.flush()
    return SessionOut.model_validate(conv)


@router.get("/sessions", response_model=Paginated)
async def list_sessions(
    request: Request,
    session: SessionDep,
    container: ContainerDep,
    user: UserDep,
    limit: int = 50,
    offset: int = 0,
) -> Paginated:
    await check_rate_limit(rate_key("rl", user.id, request.client.host), settings.rate_limit_per_minute)
    chat = container.make_chat(session)
    rows, total = await chat.list_sessions(user.tenant_id, user.id, limit=min(limit, 200), offset=offset)
    return Paginated(items=[SessionOut.model_validate(r).model_dump() for r in rows], total=total, limit=limit, offset=offset)


@router.get("/sessions/{session_id}", response_model=SessionOut)
async def get_session(session_id: uuid.UUID, session: SessionDep, container: ContainerDep, user: UserDep) -> SessionOut:
    chat = container.make_chat(session)
    conv = await chat.get_session(user.tenant_id, session_id)
    return SessionOut.model_validate(conv)


@router.patch("/sessions/{session_id}", response_model=SessionOut)
async def patch_session(
    session_id: uuid.UUID, data: SessionPatch, session: SessionDep, container: ContainerDep, user: UserDep
) -> SessionOut:
    chat = container.make_chat(session)
    conv = await chat.patch_session(user.tenant_id, session_id, data)
    return SessionOut.model_validate(conv)


@router.delete("/sessions/{session_id}")
async def delete_session(session_id: uuid.UUID, session: SessionDep, container: ContainerDep, user: UserDep) -> dict:
    chat = container.make_chat(session)
    await chat.delete_session(user.tenant_id, session_id)
    return {"deleted": True}


@router.get("/sessions/{session_id}/messages", response_model=list[MessageOut])
async def session_messages(
    session_id: uuid.UUID, session: SessionDep, container: ContainerDep, user: UserDep
) -> list[MessageOut]:
    chat = container.make_chat(session)
    rows = await chat.history(user.tenant_id, session_id)
    return [MessageOut.model_validate(r) for r in rows]


@router.post("/stream")
async def chat_stream(
    request: Request,
    data: StreamRequest,
    session: SessionDep,
    container: ContainerDep,
    user: UserDep,
) -> StreamingResponse:
    await check_rate_limit(rate_key("chat", user.id, request.client.host), settings.rate_limit_chat_per_minute)
    chat = container.make_chat(session)
    source_version = await chat.current_source_version(user.tenant_id)
    ctx = QueryContext(
        tenant_id=user.tenant_id,
        workspace_id=data.workspace_id or user.tenant_id,
        session_id=data.session_id,
        user_id=user.id,
        question=data.question,
        options=data.options,
    )
    ctx.source_version = source_version

    async def event_stream():
        yield _sse("session.created", {"session_id": str(data.session_id or uuid.uuid4())})
        yield _sse("started", {})
        controller = await chat.pipeline.stream(ctx)
        yield _sse("delta", {"text": controller.result.answer})
        yield _sse(
            "citations",
            {"citations": [c.model_dump() for c in controller.result.citations]},
        )
        yield _sse(
            "done",
            {
                "answer": controller.result.answer,
                "grounded": controller.result.grounded,
                "confidence": controller.result.confidence,
                "model": controller.result.model,
                "usage": controller.result.usage,
                "refusal": controller.result.refusal,
            },
        )

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@router.post("/answer", response_model=ChatAnswer)
async def chat_answer(
    data: AnswerRequest,
    session: SessionDep,
    container: ContainerDep,
    user: UserDep,
) -> ChatAnswer:
    chat = container.make_chat(session)
    return await chat.answer(
        tenant_id=user.tenant_id,
        user_id=user.id,
        session_id=data.session_id,
        question=data.question,
    )


@router.post("/feedback")
async def feedback(data: FeedbackCreate, session: SessionDep, container: ContainerDep, user: UserDep) -> dict:
    chat = container.make_chat(session)
    await chat.submit_feedback(user.tenant_id, data)
    return {"accepted": True}
