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

logger = get_logger("services.orchestrator")

SYSTEM_PROMPT = """You are TryMe Assistant — the enterprise AI agent for Tryvium, a B2B SaaS revenue-communication platform. You act as a senior solutions consultant speaking to business and technical decision-makers.

# Persona & tone
- Sound like a seasoned enterprise advisor: precise, confident, commercially aware, and concise.
- Use professional language; avoid filler, hype, and hedging ("I think", "probably", "maybe").
- Make every answer decision-ready: what it is, why it matters, and what to do next.

# Answer structure (markdown)
Structure every substantive answer with clear markdown headings so it reads like an executive brief:
- Start with `## Summary` — 2-4 sentences that answer the question directly and state the key takeaway.
- Follow with 2-4 focused sections most relevant to the question, e.g. `## Key capabilities`, `## Pricing & plans`, `## Integrations`, `## Security & compliance`, `## Implementation`, `## Limitations`. Choose only the sections the question needs.
- Use bullet lists (`-`) for feature lists and numbered steps (`1.`) for procedures or sequencing.
- Keep paragraphs short (1-3 sentences). Bold the most important phrase in each section opener when helpful.
- End with `## Next steps` when the answer is actionable — 2-3 concrete recommended actions.

# Grounding
- Answer ONLY from the retrieved knowledge provided after the headings below. Never invent facts, prices, dates, URLs, features, or numbers.
- Do not show sources, citations, links, or document references to the user.
- If the retrieved knowledge does not answer the question, say what is missing and suggest the exact question to ask next — do not guess.

# Length
- Prefer depth over padding: cover the question fully in roughly 300-600 words unless the user asks for more.
- Respond in the user's language.
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
        user_message, text_delta, tool_call_started, tool_call_completed,
        message_done, error."""
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
        tool_count = 0
        assistant_message_id: str | None = None
        system = await self._system_with_context(user_text, citations, tenant_id)
        try:
            # max_tool_iterations tool-call rounds; the final round is answer-only
            # (tools disabled) so the loop always ends with a plain-text reply.
            for round_no in range(self.max_tool_iterations + 1):
                allow_tools = round_no < self.max_tool_iterations
                turn, deltas = await self._run_turn(
                    system=system,
                    messages=messages,
                    tools=[t.schema() for t in self.tools.values()] if allow_tools else None,
                )
                for delta in deltas:
                    answer_parts.append(delta)
                    yield {"type": "text_delta", "text": delta}

                if not turn.tool_uses:
                    assistant_message_id = await self._persist_assistant(session, tenant_id, conversation_id, turn)
                    break

                await self._persist_assistant(session, tenant_id, conversation_id, turn)
                messages.append({"role": "assistant", "content": self._assistant_blocks(turn)})
                tool_results = []
                for tu in turn.tool_uses:
                    yield {"type": "tool_call_started", "tool_name": tu.name, "input": tu.input}
                    result, success, duration_ms, sources = await self._execute_tool(
                        session, tenant_id, conversation_id, tu.id, tu.name, tu.input
                    )
                    tool_count += 1
                    citations.extend(sources)
                    # Persist the tool result as a `tool` role message so future turns
                    # reconstruct a valid assistant-tool_use → tool_result pairing.
                    session.add(
                        Message(
                            conversation_id=conversation_id,
                            tenant_id=tenant_id,
                            role="tool",
                            content=result["content"],
                            tool_calls=[{"id": tu.id}],
                        )
                    )
                    yield {
                        "type": "tool_call_completed",
                        "tool_name": tu.name,
                        "success": success,
                        "duration_ms": duration_ms,
                    }
                    tool_results.append(result)
                messages.append({"role": "user", "content": tool_results})
                await session.commit()
            else:
                # Guardrail: all rounds consumed without a plain-text answer.
                guardrail = AssistantTurn(text=GUARDRAIL_ANSWER)
                assistant_message_id = await self._persist_assistant(session, tenant_id, conversation_id, guardrail)
                answer_parts.append(GUARDRAIL_ANSWER)
                yield {"type": "text_delta", "text": GUARDRAIL_ANSWER}
        except Exception as exc:
            logger.error("orchestration_failed", error=str(exc), exc_info=True)
            yield {"type": "error", "message": "agent processing failed"}
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
            "citations": list(dict.fromkeys(citations)),
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
        blocks = "\n\n---\n\n".join(
            f"[{index}] source: {item['source']}\n{item['text']}"
            for index, item in enumerate(context, start=1)
        )
        return (
            self._system_prompt(tenant_id)
            + "\n\n# Retrieved knowledge for this question\n"
            + blocks
            + "\n\nAnswer using ONLY the retrieved knowledge above. If it does not answer the"
            + " question, say so plainly and never invent details."
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
