"""Agent orchestrator (02-agent-and-rag-workflow.md, ADR-002).

Owns the custom tool-calling loop:
  1. reconstruct the Anthropic message list from persisted history
  2. stream an assistant turn, yielding text deltas to the client in real time
  3. if the turn contains tool_use blocks: execute each tool (tenant-scoped),
     record tool_calls audit rows, feed results back as tool_result blocks
  4. iterate up to agent_max_tool_iterations tool-call rounds, then finish with
     a final plain-text answer
  5. persist the assistant turn (content + tool_calls jsonb mirror)

No SDK is used — the message/event format is owned here (ADR-002).
"""
from __future__ import annotations

import asyncio
import time
import uuid
from collections.abc import AsyncIterator
from typing import Any

from core.anthropic_client import AnthropicClient, AssistantTurn, MessageStop, TextDelta
from core.logging import get_logger
from core.settings import settings
from db.models import Message
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from services.tools.base import BaseTool, record_tool_call

# Throttle: only 1 LLM request at a time to avoid Groq rate limits.
_llm_semaphore = asyncio.Semaphore(1)

logger = get_logger("services.orchestrator")

SYSTEM_PROMPT = """You are a helpful, knowledgeable AI assistant. You answer every question the user asks — always provide a useful, complete response.

# How to respond
- Answer EVERY question fully. Never give empty or one-word responses.
- If the question is about a specific product or service from the knowledge provided, use that knowledge.
- For general knowledge questions (geography, science, history, math, coding, etc.), answer from your training knowledge directly.
- Be clear, friendly, and professional. Use formatting (headings, bullet points, bold) to make answers easy to read.
- Keep answers proportional to the question — short questions get short answers, complex questions get detailed answers.

# Greetings
- For simple greetings like "hi", "hello", "hey", reply with a short friendly greeting: "Hi! I'm your AI assistant. How can I help you today?"

# Rules
- Never say "I don't have that information" for things you should know (general knowledge, common facts, etc.).
- If the knowledge base doesn't cover the topic, still try to help with what you know.
- Never mention RAG, retrieval, search, documents, or internal system details.
"""

GUARDRAIL_ANSWER = "I could not complete an answer within the allowed tool iterations."


class Orchestrator:
    def __init__(
        self,
        anthropic: AnthropicClient,
        tools: dict[str, BaseTool],
        *,
        max_tool_iterations: int | None = None,
        knowledge: Any = None,
        portal: Any = None,
    ) -> None:
        self.anthropic = anthropic
        self.tools = tools
        self.max_tool_iterations = max_tool_iterations or settings.agent_max_tool_iterations
        self.knowledge = knowledge
        self.portal = portal

    # -- settings overrides (admin portal) ------------------------------------

    def _system_prompt(self, tenant_id: Any) -> str:
        if self.portal is None:
            return SYSTEM_PROMPT
        return self.portal.get_setting(tenant_id, "system_prompt_override") or SYSTEM_PROMPT

    def _retrieval_top_k(self, tenant_id: Any) -> int:
        if self.portal is not None:
            value = self.portal.get_setting(tenant_id, "retrieval_top_k")
            if isinstance(value, int) and value > 0:
                return value
        return settings.retrieval_top_k

    # -- public entry -----------------------------------------------------------

    async def stream_reply(
        self,
        *,
        session: AsyncSession,
        tenant_id: uuid.UUID,
        conversation_id: uuid.UUID,
        user_text: str,
    ) -> AsyncIterator[dict[str, Any]]:
        """Process one user message and yield the locked event set:
        user_message, text_delta, message_done, error."""
        started_at = time.monotonic()
        session.add(
            Message(conversation_id=conversation_id, tenant_id=tenant_id, role="user", content=user_text)
        )
        await session.commit()
        yield {"type": "user_message", "content": user_text}

        history = await self._load_history(session, conversation_id)
        messages = self._reconstruct_anthropic_messages(history)

        citations: list[str] = []
        answer_parts: list[str] = []
        assistant_message_id: str | None = None
        system = await self._system_with_context(user_text, citations, tenant_id)
        try:
            # Single LLM call with tools disabled for reliability.
            # Tool calls cause extra API requests which trigger rate limits on free tiers.
            # _llm_semaphore ensures only one LLM call runs at a time across all requests.
            async with _llm_semaphore:
                turn, deltas = await self._run_turn(
                    system=system,
                    messages=messages,
                    tools=None,
                )
            for delta in deltas:
                answer_parts.append(delta)
                yield {"type": "text_delta", "text": delta}

            if not answer_parts:
                fallback = "I'm here to help! Could you rephrase your question?"
                answer_parts.append(fallback)
                yield {"type": "text_delta", "text": fallback}

            assistant_message_id = await self._persist_assistant(session, tenant_id, conversation_id, turn)
        except Exception as exc:
            logger.error("orchestration_failed", error=str(exc), exc_info=True)
            error_msg = f"Sorry, I encountered an error processing your request. Please try again."
            yield {"type": "error", "message": error_msg}
            await session.rollback()
            return

        await self._record_answer_metrics(
            session,
            tenant_id=tenant_id,
            conversation_id=conversation_id,
            message_id=assistant_message_id,
            question=user_text,
            answer="".join(answer_parts),
            response_time_ms=int((time.monotonic() - started_at) * 1000),
            tool_calls=tool_count,
            citations=citations,
        )

        yield {
            "type": "message_done",
            "conversation_id": str(conversation_id),
            "message_id": assistant_message_id,
        }

    async def _record_answer_metrics(
        self,
        session: AsyncSession,
        *,
        tenant_id: uuid.UUID,
        conversation_id: uuid.UUID,
        message_id: str | None,
        question: str,
        answer: str,
        response_time_ms: int,
        tool_calls: int,
        citations: list[str],
    ) -> None:
        """Persist answer metrics and surface low-confidence/unanswered turns to
        the admin portal. Never raises — observability must not break chat."""
        if self.portal is None or not answer:
            return
        try:
            await self.portal.record_metrics(
                session,
                tenant_id,
                conversation_id=conversation_id,
                question=question,
                answer=answer,
                response_time_ms=response_time_ms,
                tool_calls=tool_calls,
                citations=citations,
            )
        except Exception as exc:  # noqa: BLE001
            logger.warning("metrics_failed", error=str(exc))

    # -- turn loop --------------------------------------------------------------

    async def _system_with_context(self, user_text: str, citations: list[str], tenant_id: uuid.UUID) -> str:
        """Prepend retrieved knowledge (documents/ + site crawl) to the system prompt."""
        if self.knowledge is None:
            return self._system_prompt(tenant_id)
        top_k = self._retrieval_top_k(tenant_id)
        context = await asyncio.to_thread(self.knowledge.search, user_text, top_k)
        if not context:
            return self._system_prompt(tenant_id)
        citations.extend(item["source"] for item in context)
        blocks = "\n\n---\n\n".join(item["text"] for item in context)
        return (
            self._system_prompt(tenant_id)
            + "\n\n# Relevant knowledge (use if helpful, otherwise answer from general knowledge)\n"
            + blocks
        )

    async def _run_turn(
        self, *, system: str, messages: list[dict[str, Any]], tools: list[dict[str, Any]] | None
    ) -> tuple[AssistantTurn, list[str]]:
        """Stream one LLM turn, returning (turn, buffered text deltas).

        Deltas are buffered per-turn locally (no shared instance state), then
        flushed to the client by stream_reply before the next await."""
        deltas: list[str] = []
        turn: AssistantTurn | None = None
        async for event in self.anthropic.stream(system=system, messages=messages, tools=tools):
            if isinstance(event, TextDelta):
                deltas.append(event.text)
            elif isinstance(event, MessageStop):
                turn = event.turn
        if turn is None:
            raise RuntimeError("anthropic stream ended without a message_stop")
        return turn, deltas

    # -- tools ------------------------------------------------------------------

    async def _execute_tool(
        self,
        session: AsyncSession,
        tenant_id: uuid.UUID,
        conversation_id: uuid.UUID,
        tool_use_id: str,
        name: str,
        input: dict[str, Any],
    ) -> tuple[dict[str, Any], bool, int, list[str]]:
        tool = self.tools.get(name)
        started = time.monotonic()
        success = True
        content = ""
        sources: list[str] = []
        try:
            if tool is None:
                raise ValueError(f"unknown tool: {name}")
            validated = tool.input_schema.model_validate(input)  # guardrail: pydantic-validate every tool_use
            result = await tool.execute(
                tenant_id=tenant_id,
                session=session,
                **validated.model_dump(),
            )
            content = result.content
            sources = result.sources
        except Exception as exc:  # tool failure becomes an error result for the model
            logger.warning("tool_failed", tool=name, error=str(exc))
            success = False
            content = f"Tool `{name}` failed: {exc}"
        duration_ms = int((time.monotonic() - started) * 1000)

        await record_tool_call(
            session=session,
            conversation_id=conversation_id,
            tenant_id=tenant_id,
            tool_name=name,
            input=input,
            output={"content": content},
            duration_ms=duration_ms,
            success=success,
        )
        return {"type": "tool_result", "tool_use_id": tool_use_id, "content": content}, success, duration_ms, sources

    # -- persistence ------------------------------------------------------------

    async def _persist_assistant(self, session: AsyncSession, tenant_id: uuid.UUID, conversation_id: uuid.UUID, turn: AssistantTurn) -> str:
        message = Message(
            conversation_id=conversation_id,
            tenant_id=tenant_id,
            role="assistant",
            content=turn.text,
            tool_calls=[{"id": t.id, "name": t.name, "input": t.input} for t in turn.tool_uses],
        )
        session.add(message)
        await session.commit()
        return str(message.id)

    # -- history ----------------------------------------------------------------

    async def _load_history(self, session: AsyncSession, conversation_id: uuid.UUID) -> list[Message]:
        stmt = select(Message).where(Message.conversation_id == conversation_id).order_by(Message.created_at)
        return list((await session.execute(stmt)).scalars())

    @staticmethod
    def _assistant_blocks(turn: AssistantTurn) -> list[dict[str, Any]]:
        blocks: list[dict[str, Any]] = []
        if turn.text:
            blocks.append({"type": "text", "text": turn.text})
        for t in turn.tool_uses:
            blocks.append({"type": "tool_use", "id": t.id, "name": t.name, "input": t.input})
        return blocks

    @classmethod
    def _reconstruct_anthropic_messages(cls, history: list[Message]) -> list[dict[str, Any]]:
        """Rebuild the Anthropic wire format from persisted rows (messages.tool_calls
        jsonb mirrors tool_use/tool_result blocks verbatim)."""
        out: list[dict[str, Any]] = []
        for msg in history:
            if msg.role == "user":
                out.append({"role": "user", "content": msg.content})
            elif msg.role == "assistant":
                blocks: list[dict[str, Any]] = []
                if msg.content:
                    blocks.append({"type": "text", "text": msg.content})
                for tc in msg.tool_calls or []:
                    blocks.append({"type": "tool_use", "id": tc["id"], "name": tc["name"], "input": tc.get("input", {})})
                if blocks:
                    out.append({"role": "assistant", "content": blocks})
            elif msg.role == "tool":
                content = msg.content
                if msg.tool_calls and isinstance(msg.tool_calls, list) and msg.tool_calls:
                    content = {"type": "tool_result", "tool_use_id": msg.tool_calls[0].get("id", ""), "content": msg.content}
                out.append({"role": "user", "content": [content]})
        return out
