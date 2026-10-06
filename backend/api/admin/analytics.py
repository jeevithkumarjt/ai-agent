"""Admin analytics + conversation browsing + feedback routes.

Analytics are computed live from the core tables (conversations, messages,
tool_calls) and the admin tables (answer_metrics, message_feedback)."""
from __future__ import annotations

import uuid
from typing import Annotated

from core.rbac import SCOPE_ANALYTICS, SCOPE_CONVERSATIONS
from db.admin_models import AnswerMetric, MessageFeedback, UnansweredQuestion
from db.models import Conversation, DocumentChunk, Message, ToolCall
from db.session import get_session
from fastapi import APIRouter, Depends, HTTPException, status
from services.portal import PortalService
from sqlalchemy import case, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from api.admin.deps import Principal, portal, require_scope

router = APIRouter(tags=["admin-analytics"])


def _day(col):
    return func.date_trunc("day", col).label("day")


@router.get("/overview")
async def overview(
    principal: Annotated[Principal, Depends(require_scope(SCOPE_ANALYTICS))],
    portal_service: Annotated[PortalService, Depends(portal)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> dict:
    tenant = principal.tenant_id
    conversations = await session.scalar(select(func.count()).select_from(Conversation).where(Conversation.tenant_id == tenant)) or 0
    messages = await session.scalar(select(func.count()).select_from(Message).where(Message.tenant_id == tenant)) or 0
    assistant_msgs = await session.scalar(
        select(func.count()).select_from(Message).where(Message.tenant_id == tenant, Message.role == "assistant")
    ) or 0
    today_convos = await session.scalar(
        select(func.count()).select_from(Conversation).where(Conversation.tenant_id == tenant, Conversation.created_at >= func.date_trunc("day", func.now()))
    ) or 0
    documents = await portal_service.list_documents(session, tenant, limit=1)
    doc_total = documents["total"]
    unans_total = await session.scalar(
        select(func.count()).select_from(UnansweredQuestion).where(UnansweredQuestion.tenant_id == tenant)
    ) or 0
    unans_new = await session.scalar(
        select(func.count()).select_from(UnansweredQuestion).where(UnansweredQuestion.tenant_id == tenant, UnansweredQuestion.status == "new")
    ) or 0
    avg_rt = await session.scalar(
        select(func.avg(AnswerMetric.response_time_ms)).where(AnswerMetric.tenant_id == tenant)
    ) or 0
    answered_count = await session.scalar(
        select(func.count()).select_from(AnswerMetric).where(AnswerMetric.tenant_id == tenant, AnswerMetric.answered.is_(True))
    ) or 0
    metric_total = await session.scalar(select(func.count()).select_from(AnswerMetric).where(AnswerMetric.tenant_id == tenant)) or 0
    satisfaction = await session.scalar(select(func.avg(MessageFeedback.rating)).where(MessageFeedback.tenant_id == tenant)) or 0
    tool_calls = await session.scalar(select(func.count()).select_from(ToolCall).where(ToolCall.tenant_id == tenant)) or 0
    return {
        "conversations": conversations,
        "messages": messages,
        "assistant_messages": assistant_msgs,
        "today_conversations": today_convos,
        "documents": doc_total,
        "unanswered_total": unans_total,
        "unanswered_new": unans_new,
        "avg_response_time_ms": int(avg_rt or 0),
        "answered_percent": round(answered_count / metric_total * 100, 1) if metric_total else 0.0,
        "satisfaction": round(float(satisfaction or 0), 2),
        "tool_calls": tool_calls,
    }


@router.get("/analytics/trends")
async def trends(
    principal: Annotated[Principal, Depends(require_scope(SCOPE_ANALYTICS))],
    session: Annotated[AsyncSession, Depends(get_session)],
    days: int = 14,
) -> dict:
    tenant = principal.tenant_id
    since = func.now() - func.make_interval(0, 0, 0, days)
    conv_rows = (await session.execute(
        select(_day(Conversation.created_at), func.count(Conversation.id))
        .where(Conversation.tenant_id == tenant, Conversation.created_at >= since)
        .group_by("day").order_by("day")
    )).all()
    msg_rows = (await session.execute(
        select(_day(Message.created_at), func.count(Message.id))
        .where(Message.tenant_id == tenant, Message.created_at >= since)
        .group_by("day").order_by("day")
    )).all()
    metric_rows = (await session.execute(
        select(_day(AnswerMetric.created_at), func.avg(AnswerMetric.response_time_ms), func.count(AnswerMetric.id), func.sum(case((AnswerMetric.answered.is_(True), 1), else_=0)))
        .where(AnswerMetric.tenant_id == tenant, AnswerMetric.created_at >= since)
        .group_by("day").order_by("day")
    )).all()
    days_out: dict[str, dict[str, float | int]] = {}
    for row in conv_rows:
        day = str(row.day.date())
        days_out.setdefault(day, {"conversations": 0, "messages": 0, "avg_response_ms": 0, "answers": 0})["conversations"] = row[1]
    for row in msg_rows:
        day = str(row.day.date())
        days_out.setdefault(day, {"conversations": 0, "messages": 0, "avg_response_ms": 0, "answers": 0})["messages"] = row[1]
    for row in metric_rows:
        day = str(row.day.date())
        bucket = days_out.setdefault(day, {"conversations": 0, "messages": 0, "avg_response_ms": 0, "answers": 0})
        bucket["avg_response_ms"] = int(row[1] or 0)
        bucket["answers"] = row[2]
    return {"days": [{"date": day, **days_out[day]} for day in sorted(days_out)]}


@router.get("/analytics/top-queries")
async def top_queries(
    principal: Annotated[Principal, Depends(require_scope(SCOPE_ANALYTICS))],
    session: Annotated[AsyncSession, Depends(get_session)],
    limit: int = 10,
) -> dict:
    tenant = principal.tenant_id
    rows = (await session.execute(
        select(AnswerMetric.question, func.count(AnswerMetric.id), func.avg(AnswerMetric.response_time_ms))
        .where(AnswerMetric.tenant_id == tenant)
        .group_by(AnswerMetric.question)
        .order_by(func.count(AnswerMetric.id).desc())
        .limit(limit)
    )).all()
    return {"items": [{"question": q, "count": c, "avg_response_ms": int(avg or 0)} for q, c, avg in rows]}


@router.get("/analytics/funnel")
async def funnel(
    principal: Annotated[Principal, Depends(require_scope(SCOPE_ANALYTICS))],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> dict:
    tenant = principal.tenant_id
    conversations = await session.scalar(select(func.count()).select_from(Conversation).where(Conversation.tenant_id == tenant)) or 0
    user_msgs = await session.scalar(select(func.count()).select_from(Message).where(Message.tenant_id == tenant, Message.role == "user")) or 0
    answered = await session.scalar(select(func.count()).select_from(AnswerMetric).where(AnswerMetric.tenant_id == tenant, AnswerMetric.answered.is_(True))) or 0
    rated = await session.scalar(select(func.count()).select_from(MessageFeedback).where(MessageFeedback.tenant_id == tenant)) or 0
    return {"steps": [
        {"name": "Conversations started", "value": conversations},
        {"name": "Questions asked", "value": user_msgs},
        {"name": "Questions answered", "value": answered},
        {"name": "Ratings submitted", "value": rated},
    ]}


@router.get("/analytics/distribution")
async def distribution(
    principal: Annotated[Principal, Depends(require_scope(SCOPE_ANALYTICS))],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> dict:
    tenant = principal.tenant_id
    answered = await session.scalar(select(func.count()).select_from(AnswerMetric).where(AnswerMetric.tenant_id == tenant, AnswerMetric.answered.is_(True))) or 0
    unanswered = await session.scalar(select(func.count()).select_from(AnswerMetric).where(AnswerMetric.tenant_id == tenant, AnswerMetric.answered.is_(False))) or 0
    tool_rows = (await session.execute(
        select(ToolCall.tool_name, func.count(ToolCall.id))
        .where(ToolCall.tenant_id == tenant)
        .group_by(ToolCall.tool_name).order_by(func.count(ToolCall.id).desc())
    )).all()
    rating_rows = (await session.execute(
        select(MessageFeedback.rating, func.count(MessageFeedback.id))
        .where(MessageFeedback.tenant_id == tenant)
        .group_by(MessageFeedback.rating)
    )).all()
    return {
        "answer_split": {"answered": answered, "unanswered": unanswered},
        "tools": [{"name": name, "count": c} for name, c in tool_rows],
        "ratings": {str(rating): count for rating, count in rating_rows},
    }


@router.get("/analytics/document-usage")
async def document_usage(
    principal: Annotated[Principal, Depends(require_scope(SCOPE_ANALYTICS))],
    session: Annotated[AsyncSession, Depends(get_session)],
    limit: int = 10,
) -> dict:
    tenant = principal.tenant_id
    rows = (await session.execute(
        select(DocumentChunk.source_id, func.count(DocumentChunk.id))
        .where(DocumentChunk.tenant_id == tenant)
        .group_by(DocumentChunk.source_id)
        .order_by(func.count(DocumentChunk.id).desc())
        .limit(limit)
    )).all()
    return {"items": [{"source": src, "chunks": c} for src, c in rows]}


@router.get("/conversations")
async def conversations(
    principal: Annotated[Principal, Depends(require_scope(SCOPE_CONVERSATIONS))],
    session: Annotated[AsyncSession, Depends(get_session)],
    q: str = "",
    limit: int = 100,
    offset: int = 0,
) -> dict:
    tenant = principal.tenant_id
    msg_count = func.count(Message.id).label("message_count")
    stmt = (
        select(Conversation, msg_count, func.max(Message.created_at).label("last_at"))
        .outerjoin(Message, Message.conversation_id == Conversation.id)
        .where(Conversation.tenant_id == tenant)
        .group_by(Conversation.id)
        .order_by(func.max(Message.created_at).desc().nullslast())
    )
    total_stmt = select(func.count()).select_from(Conversation).where(Conversation.tenant_id == tenant)
    if q:
        like = f"%{q}%"
        stmt = stmt.where(Conversation.id.cast(str).ilike(like))
        total_stmt = total_stmt.where(Conversation.id.cast(str).ilike(like))
    total = await session.scalar(total_stmt) or 0
    rows = (await session.execute(stmt.limit(limit).offset(offset))).all()
    items = [{
        "id": str(conv.id), "user_id": str(conv.user_id), "created_at": str(conv.created_at),
        "message_count": count, "last_message_at": str(last_at) if last_at else None,
    } for conv, count, last_at in rows]
    return {"items": items, "total": total, "limit": limit, "offset": offset}


@router.get("/conversations/{conversation_id}")
async def conversation_detail(
    conversation_id: uuid.UUID,
    principal: Annotated[Principal, Depends(require_scope(SCOPE_CONVERSATIONS))],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> dict:
    conv = await session.get(Conversation, conversation_id)
    if conv is None or conv.tenant_id != principal.tenant_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="conversation not found")
    msgs = (await session.scalars(
        select(Message).where(Message.conversation_id == conversation_id).order_by(Message.created_at)
    )).all()
    metrics = (await session.scalars(
        select(AnswerMetric).where(AnswerMetric.conversation_id == conversation_id)
    )).all()
    return {
        "id": str(conv.id), "user_id": str(conv.user_id), "created_at": str(conv.created_at),
        "messages": [{"id": str(m.id), "role": m.role, "content": m.content, "created_at": str(m.created_at)} for m in msgs],
        "metrics": [{"question": m.question, "answered": m.answered, "confidence": m.confidence,
                     "response_time_ms": m.response_time_ms, "created_at": str(m.created_at)} for m in metrics],
    }


@router.get("/feedback")
async def feedback(
    principal: Annotated[Principal, Depends(require_scope(SCOPE_CONVERSATIONS))],
    portal_service: Annotated[PortalService, Depends(portal)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> dict:
    return await portal_service.list_feedback(session, principal.tenant_id)
