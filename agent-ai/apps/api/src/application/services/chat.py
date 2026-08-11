from __future__ import annotations

import hashlib
import json
import time
import uuid

from application.pipeline.query_pipeline import QueryContext, QueryPipeline
from application.services.memory import MemoryService
from config import settings
from db.redis import get_redis
from domain.errors import NotFoundError, ForbiddenError
from domain.models import Conversation, Feedback, Message
from domain.schemas.chat import ChatAnswer, FeedbackCreate, RetrievalMeta, SessionPatch
from infrastructure.repository.conversation_repo import ConversationRepository, MessageRepository
from infrastructure.repository.source_repo import SourceRepository
from logging import get_logger

logger = get_logger("chat")


class ChatService:
    def __init__(
        self,
        pipeline: QueryPipeline,
        conversations: ConversationRepository,
        messages: MessageRepository,
        sources: SourceRepository,
        memory: MemoryService,
    ) -> None:
        self.pipeline = pipeline
        self.conversations = conversations
        self.messages = messages
        self.sources = sources
        self.memory = memory

    async def current_source_version(self, tenant_id: uuid.UUID) -> int:
        rows, _ = await self.sources.list_all(tenant_id=tenant_id, limit=1)
        # version comes from the newest enabled source; a workspace with no sources = 0 (nothing indexed)
        return max((r.version for r in rows if r.state == "enabled"), default=1)

    async def answer(
        self,
        *,
        tenant_id: uuid.UUID,
        user_id: uuid.UUID,
        session_id: uuid.UUID | None,
        question: str,
    ) -> ChatAnswer:
        cache_key = self._response_cache_key(tenant_id, session_id, question)
        cached = await self._get_response_cache(cache_key)
        if cached is not None:
            return ChatAnswer.model_validate(cached)

        start = time.perf_counter()
        source_version = await self.current_source_version(tenant_id)

        if session_id is None:
            conv = Conversation(tenant_id=tenant_id, user_id=user_id, title=question[:80])
            await self.conversations.add(conv)
            await self.conversations.session.flush()
            session_id = conv.id
        else:
            conv = await self.conversations.get(session_id, tenant_id=tenant_id)
            if conv.archived_at is not None:
                raise ForbiddenError("conversation is archived")

        await self.memory.remember_turn(str(tenant_id), str(session_id), "user", question)

        ctx = QueryContext(
            tenant_id=tenant_id,
            workspace_id=tenant_id,
            session_id=session_id,
            user_id=user_id,
            question=question,
        )
        ctx.source_version = source_version
        result = await self.pipeline.run(ctx)

        user_msg = Message(
            session_id=session_id,
            tenant_id=tenant_id,
            role="user",
            content=question,
        )
        assistant_msg = Message(
            session_id=session_id,
            tenant_id=tenant_id,
            role="assistant",
            content=result.answer,
            citations=[c.model_dump() for c in result.citations],
            confidence=result.confidence,
            grounded=result.grounded,
            model=result.model.get("model"),
            provider=result.model.get("provider"),
            tokens_in=result.usage.get("prompt_tokens", 0),
            tokens_out=result.usage.get("completion_tokens", 0),
            latency_ms=result.latency_ms,
            retrieval={
                "rewrites": result.rewrites,
                "source_version": source_version,
                "degraded": result.degraded,
            },
        )
        self.messages.add(user_msg)
        self.messages.add(assistant_msg)
        await self.messages.session.flush()

        await self.memory.remember_turn(str(tenant_id), str(session_id), "assistant", result.answer)
        await self.memory.update_conversation_summary(
            str(tenant_id), str(session_id), [{"role": "user", "content": question}]
        )

        total_latency = int((time.perf_counter() - start) * 1000)
        answer = ChatAnswer(
            answer=result.answer,
            grounded=result.grounded,
            confidence=result.confidence,
            citations=result.citations,
            model=result.model,
            usage=result.usage,
            message_id=assistant_msg.id,
            session_id=session_id,
            retrieval=RetrievalMeta(
                top_k=settings.retrieval_top_k,
                reranked_top_k=settings.retrieval_rerank_top_k,
                query_rewrites=result.rewrites,
                latency_ms=result.latency_ms,
            ),
            degraded=result.degraded,
            refusal=result.refusal,
        )
        await self._set_response_cache(cache_key, answer, total_latency)
        return answer

    async def list_sessions(self, tenant_id: uuid.UUID, user_id: uuid.UUID, *, limit: int, offset: int) -> tuple[list[Conversation], int]:
        return await self.conversations.list_for_user(tenant_id, user_id, limit=limit, offset=offset)

    async def get_session(self, tenant_id: uuid.UUID, session_id: uuid.UUID) -> Conversation:
        return await self.conversations.get(session_id, tenant_id=tenant_id)

    async def patch_session(self, tenant_id: uuid.UUID, session_id: uuid.UUID, patch: SessionPatch) -> Conversation:
        conv = await self.conversations.get(session_id, tenant_id=tenant_id)
        if patch.title is not None:
            conv.title = patch.title
        if patch.pinned is not None:
            conv.pinned = patch.pinned
        return conv

    async def delete_session(self, tenant_id: uuid.UUID, session_id: uuid.UUID) -> None:
        conv = await self.conversations.get(session_id, tenant_id=tenant_id)
        conv.archived_at = __import__("datetime").datetime.now(__import__("datetime").timezone.utc)

    async def history(self, tenant_id: uuid.UUID, session_id: uuid.UUID, *, limit: int = 200) -> list[Message]:
        await self.conversations.get(session_id, tenant_id=tenant_id)
        return await self.messages.list_for_session(session_id, limit=limit)

    async def submit_feedback(self, tenant_id: uuid.UUID, fb: FeedbackCreate) -> Feedback:
        row = Feedback(
            message_id=fb.message_id,
            tenant_id=tenant_id,
            rating=fb.rating,
            comment=fb.comment,
        )
        await self.messages.session.add(row)
        return row

    # --- Response cache ---
    @staticmethod
    def _response_cache_key(tenant_id: uuid.UUID, session_id: uuid.UUID | None, question: str) -> str:
        digest = hashlib.sha256(f"{session_id}|{question}".encode()).hexdigest()
        return f"agentai:{tenant_id}:cache:response:{digest}"

    async def _get_response_cache(self, key: str) -> dict | None:
        if not settings.cache_enabled:
            return None
        raw = await get_redis().get(key)
        if not raw:
            return None
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            return None

    async def _set_response_cache(self, key: str, answer: ChatAnswer, latency_ms: int) -> None:
        if not settings.cache_enabled:
            return
        payload = answer.model_dump(mode="json")
        payload["_cached_latency_ms"] = latency_ms
        await get_redis().set(key, json.dumps(payload), ex=settings.cache_response_ttl)
