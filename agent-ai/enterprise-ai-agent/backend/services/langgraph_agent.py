"""LangGraph supervisor + specialist agents (opt-in multi-agent mode).

When USE_LANGGRAPH is enabled the Orchestrator routes each user turn through a
LangGraph StateGraph: a supervisor classifies intent, then a specialist worker
(knowledge / support / sales / chat) answers with its own system prompt and the
shared search_knowledge_base tool. The single-agent loop remains the fallback.

Overhead: each turn costs a supervisor LLM call plus up to two worker calls, so
it suits paid Groq tiers and short sessions.
"""
from __future__ import annotations

import asyncio
import time
from functools import partial
from typing import Any, TypedDict

from langchain_core.messages import AIMessage, HumanMessage, SystemMessage, ToolMessage
from langchain_core.runnables import RunnableConfig
from langchain_core.tools import tool
from langchain_openai import ChatOpenAI
from langgraph.graph import END, StateGraph

from core.logging import get_logger
from core.settings import settings
from services.orchestrator import SYSTEM_PROMPT
from services.tools.base import BaseTool, record_tool_call

logger = get_logger("services.langgraph")

ROUTES = ("knowledge", "support", "sales", "chat")

HONEST_REFUSAL = "I don't have that information in the available materials yet."

TOOL_PROMPT = (
    "\n\nWhen the answer may live in internal documents, policies, pricing, or FAQ, "
    "call the `search_knowledge_base` tool before answering."
)

KNOWLEDGE_PERSONA = SYSTEM_PROMPT + TOOL_PROMPT

SUPPORT_PERSONA = (
    "You are the Tryvium support specialist in an enterprise helpdesk. Help with using "
    "the platform, troubleshooting, deployments, self-service portals, FAQs, "
    "contact/support channels, and IT/HR service operations.\n"
) + SYSTEM_PROMPT + TOOL_PROMPT

SALES_PERSONA = (
    "You are the Tryvium sales specialist. Discuss pricing, plans, demos, onboarding, "
    "ROI, enterprise vs standard, trials, and how to get started or buy.\n"
) + SYSTEM_PROMPT + TOOL_PROMPT

CHAT_PERSONA = (
    "You are a friendly, concise assistant. For greetings and small talk respond briefly. "
    "For general topics (math, science, coding, travel) you may answer from general knowledge. "
    "For any Tryvium product or company question you MUST use the search_knowledge_base tool "
    "and answer only from its results.\n"
) + SYSTEM_PROMPT

SUPERVISOR_PROMPT = """You route an enterprise assistant's user request to the best specialist. Return exactly one word from: knowledge, support, sales, chat.

Rules:
- support: how-to, troubleshooting, broken/not working, setup, deployment, contact support, helpdesk, IT or HR service issues.
- sales: pricing, plans, cost, buy, subscription, trial, demo, compare plans, enterprise vs standard, ROI, onboarding.
- chat: greetings, thanks, small talk, general (non-Tryvium) topics.
- knowledge: anything else about Tryvium's platform, products, solutions, services, policies, careers.
If unsure, choose knowledge. Reply with a single word."""

PERSONAS: dict[str, str] = {
    "knowledge": KNOWLEDGE_PERSONA,
    "support": SUPPORT_PERSONA,
    "sales": SALES_PERSONA,
    "chat": CHAT_PERSONA,
}

MAX_WORKER_ITERATIONS = 3


class GraphState(TypedDict, total=False):
    query: str
    messages: list[dict[str, str]]
    route: str
    answer: str
    sources: list[str]


class LangGraphAgent:
    """Supervisor router + specialist worker graph sharing the RAG tool."""

    def __init__(self, tools: dict[str, BaseTool], knowledge: Any = None) -> None:
        self.tools = tools
        self.knowledge = knowledge
        self.search_tool = tools.get("search_knowledge_base")
        if self.search_tool is None:
            raise ValueError("LangGraphAgent requires the search_knowledge_base tool")
        self._graph = None
        self._langchain_search = self._build_search_tool()

    def _llm(self, *, temperature: float, max_tokens: int) -> ChatOpenAI:
        return ChatOpenAI(
            model=settings.anthropic_model,
            api_key=settings.anthropic_api_key,
            base_url=settings.anthropic_base_url,
            temperature=temperature,
            max_tokens=max_tokens,
            max_retries=3,
            timeout=180,
        )

    @staticmethod
    def _to_lc_message(message: dict[str, str]) -> Any:
        role, content = message.get("role", "user"), message.get("content", "")
        if role == "assistant":
            return AIMessage(content=content)
        if role == "tool":
            return HumanMessage(content=f"[tool result] {content}")
        return HumanMessage(content=content)

    def _build_search_tool(self):
        base_tool = self.search_tool

        async def _retrieve(query: str, top_k: int, *, session: Any, tenant_id: Any) -> tuple[str, list[str]]:
            if session is not None and tenant_id is not None:
                try:
                    validated = base_tool.input_schema(query=query, top_k=top_k)
                    result = await base_tool.execute(
                        tenant_id=tenant_id, session=session, **validated.model_dump()
                    )
                    body = result.content
                    if body and not body.startswith("Tool `"):
                        return body, result.sources
                except Exception as exc:  # noqa: BLE001
                    logger.warning("langgraph_db_rag_failed_using_memory", error=str(exc))
            if self.knowledge is None:
                return "No relevant documents found in the knowledge base.", []
            items = await asyncio.to_thread(
                self.knowledge.search, query, max(1, top_k), kinds=None
            )
            if not items:
                return "No relevant documents found in the knowledge base.", []
            parts, sources = [], []
            for i, item in enumerate(items, start=1):
                source = item.get("source", "")
                sources.append(source)
                parts.append(f"[{i}] source: {source}\n{item.get('text', '')}")
            body = "\n\n---\n\n".join(parts)
            if len(body) > 12000:
                body = body[:12000] + "\n…(truncated)"
            return body, sources

        @tool
        async def search_knowledge_base(
            query: str, top_k: int = 10, config: RunnableConfig | None = None
        ) -> str:
            """Search the organization's knowledge base using semantic retrieval. Use this whenever the answer may live in internal documents, policies, pricing, or FAQ."""
            ctx = (config or {}).get("configurable") or {}
            session = ctx.get("session")
            tenant_id = ctx.get("tenant_id")
            conversation_id = ctx.get("conversation_id")
            citations = ctx.get("citations")
            started = time.monotonic()
            success = True
            try:
                content, sources = await _retrieve(query, top_k, session=session, tenant_id=tenant_id)
                if citations is not None:
                    citations.extend(sources)
            except Exception as exc:  # noqa: BLE001
                success = False
                content = f"Tool `{base_tool.name}` failed: {exc}"
            if session is not None and conversation_id is not None:
                await record_tool_call(
                    session=session,
                    conversation_id=conversation_id,
                    tenant_id=tenant_id,
                    tool_name=base_tool.name,
                    input={"query": query, "top_k": top_k},
                    output={"content": content},
                    duration_ms=int((time.monotonic() - started) * 1000),
                    success=success,
                )
            return content

        return search_knowledge_base

    async def _supervisor(self, state: GraphState, config: RunnableConfig) -> dict[str, str]:
        llm = self._llm(temperature=0.0, max_tokens=256)
        prompt = [SystemMessage(content=SUPERVISOR_PROMPT)]
        prompt += [self._to_lc_message(m) for m in (state.get("messages") or [])]
        try:
            res = await llm.ainvoke(prompt)
            text = res.content if isinstance(res.content, str) else ""
        except Exception as exc:  # noqa: BLE001
            logger.warning("supervisor_failed_default_knowledge", error=str(exc))
            text = "knowledge"
        matched = [r for r in ROUTES if r in text.lower()]
        route = matched[0] if matched else "knowledge"
        last = (state.get("messages") or [{}])[-1]
        logger.info("langgraph_route", route=route, query=str(last.get("content", ""))[:80])
        return {"route": route}

    async def _run_worker(
        self, state: GraphState, config: RunnableConfig, *, persona: str, use_tool: bool
    ) -> dict[str, Any]:
        llm = self._llm(temperature=0.2, max_tokens=settings.anthropic_max_tokens)
        model = llm.bind_tools([self._langchain_search]) if use_tool else llm
        state_messages = state.get("messages") or []
        messages: list[Any] = [SystemMessage(content=persona)]
        messages += [self._to_lc_message(m) for m in state_messages]
        tool_contents: list[str] = []
        rounds_done = 0
        for iteration in range(MAX_WORKER_ITERATIONS):
            try:
                res = await model.ainvoke(messages)
            except Exception as exc:  # noqa: BLE001
                if use_tool:
                    logger.warning("worker_fallback_no_tools", error=str(exc))
                    model = llm
                    use_tool = False
                    continue
                raise
            if res.tool_calls:
                logger.info(
                    "langgraph_worker_iter",
                    route=state.get("route"),
                    iteration=iteration,
                    tool_calls=len(res.tool_calls),
                    content_len=len(res.content) if isinstance(res.content, str) else 0,
                )
                messages.append(res)
                for tc in res.tool_calls:
                    args = tc.get("args") or {}
                    try:
                        out = await self._langchain_search.ainvoke(args, config=config)
                        content = str(out)
                    except Exception as exc:  # noqa: BLE001
                        content = f"Tool error: {exc}"
                    tool_contents.append(content)
                    messages.append(ToolMessage(content=content, tool_call_id=tc.get("id") or ""))
                rounds_done += 1
                real_now = any(
                    c
                    and "No relevant documents found" not in c
                    and not c.startswith("Tool `")
                    and not c.startswith("Tool error")
                    for c in tool_contents
                )
                if rounds_done >= MAX_WORKER_ITERATIONS or not real_now:
                    return await self._final_answer(llm, persona, state_messages, tool_contents)
                continue
            text = res.content if isinstance(res.content, str) else ""
            if text.strip():
                return {"answer": text, "sources": state.get("sources") or []}
            return await self._final_answer(llm, persona, state_messages, tool_contents)
        return await self._final_answer(llm, persona, state_messages, tool_contents)

    async def _final_answer(
        self, llm: ChatOpenAI, persona: str, history: list[dict[str, str]], tool_contents: list[str]
    ) -> dict[str, Any]:
        real = [
            c
            for c in tool_contents
            if c
            and "No relevant documents found" not in c
            and not c.startswith("Tool `")
            and not c.startswith("Tool error")
        ]
        if not real:
            return {"answer": HONEST_REFUSAL, "sources": []}
        system = (
            persona
            + "\n\n# Retrieved knowledge (ground your answer ONLY in this material)\n"
            + "\n\n---\n\n".join(real)
        )
        messages: list[Any] = [SystemMessage(content=system)]
        messages += [self._to_lc_message(m) for m in history]
        try:
            res = await llm.ainvoke(messages)
            text = res.content if isinstance(res.content, str) else ""
        except Exception:  # noqa: BLE001
            text = ""
        return {"answer": text.strip() or HONEST_REFUSAL, "sources": []}

    def _ensure_graph(self) -> StateGraph:
        if self._graph is not None:
            return self._graph
        graph = StateGraph(GraphState)
        graph.add_node("supervisor", self._supervisor)
        for route in ROUTES:
            graph.add_node(
                f"worker_{route}",
                partial(self._run_worker, persona=PERSONAS[route], use_tool=True),
            )
        graph.add_conditional_edges(
            "supervisor",
            lambda state: state.get("route") or "knowledge",
            {route: f"worker_{route}" for route in ROUTES},
        )
        graph.set_entry_point("supervisor")
        for route in ROUTES:
            graph.add_edge(f"worker_{route}", END)
        self._graph = graph.compile()
        return self._graph

    async def run(
        self,
        *,
        query: str,
        history: list[dict[str, str]],
        session: Any,
        tenant_id: Any,
        conversation_id: Any,
    ) -> tuple[str, list[str]]:
        citations: list[str] = []
        config: dict[str, Any] = {
            "configurable": {
                "session": session,
                "tenant_id": tenant_id,
                "conversation_id": conversation_id,
                "citations": citations,
            }
        }
        graph = self._ensure_graph()
        result = await graph.ainvoke(
            {"query": query, "messages": history, "sources": []},
            config=config,
        )
        answer = (result.get("answer") or "").strip()
        if not answer:
            raise RuntimeError("langgraph produced an empty answer")
        return answer, list(citations)