from __future__ import annotations

import asyncio
import json
import time
import uuid
from dataclasses import dataclass, field

from application.pipeline.confidence import ConfidenceInput, confidence_score, freshness_decay
from application.pipeline.grounder import GroundingVerifier, sanitize_context_chunk
from application.pipeline.intent import Intent, classify_intent_rule_based
from application.pipeline.multi_query import multi_query_expand
from application.pipeline.rewrite import rewrite_query
from application.pipeline.validator import (
    validate_citations,
    validate_length,
    validate_refusal_mismatch,
)
from application.services.cache import invalidate_tenant  # re-export used by workers
from application.services.memory import MemoryService
from application.services.prompt_builder import PromptContext, build_synthesis_messages
from application.services.retrieval import RetrievalResult, RetrievalService
from config import settings
from db.redis import get_redis
from domain.errors import UpstreamError
from domain.schemas.chat import ChatOptions, Citation
from infrastructure.providers.llm.gateway import LLMGateway
from infrastructure.search.filters import RetrievalFilters
from logging import get_logger
from telemetry import counter, histogram, tracer

logger = get_logger("pipeline.query")

answer_latency = histogram("agentai_answer_latency_seconds", "End-to-end answer latency", "seconds")
grounded_counter = counter("agentai_answer_grounded_total", "Answers by groundedness")
hallucination_counter = counter("agentai_hallucination_flags_total", "Verifier rejections")
tokens_counter = counter("agentai_tokens_total", "Token usage", "tokens")
confidence_hist = histogram("agentai_confidence", "Confidence distribution")


@dataclass
class QueryContext:
    tenant_id: uuid.UUID
    workspace_id: uuid.UUID
    session_id: uuid.UUID | None
    user_id: uuid.UUID
    question: str
    options: ChatOptions = field(default_factory=ChatOptions)
    source_version: int = 1


@dataclass
class PipelineResult:
    answer: str
    grounded: bool
    confidence: float
    citations: list[Citation]
    model: dict[str, str]
    usage: dict[str, int]
    refusal: bool = False
    degraded: bool = False
    rewrites: list[str] = field(default_factory=list)
    latency_ms: int = 0


class QueryPipeline:
    """Deterministic agentic workflow: intent → rewrite → multi-query → hybrid retrieve →
    fuse → rerank → compress → ground → synthesize → validate."""

    def __init__(
        self,
        retrieval: RetrievalService,
        gateway: LLMGateway,
        memory: MemoryService,
    ) -> None:
        self.retrieval = retrieval
        self.gateway = gateway
        self.memory = memory
        self.verifier = GroundingVerifier(threshold=0.5)

    async def run(self, ctx: QueryContext) -> PipelineResult:
        start = time.perf_counter()
        filters = RetrievalFilters(
            tenant_id=str(ctx.tenant_id),
            source_version=ctx.source_version,
        )

        # 1. intent
        intent = classify_intent_rule_based(ctx.question)
        if intent == Intent.GREETING:
            return PipelineResult(
                answer="Hello! I'm the Tryvium knowledge assistant. Ask me anything about Tryvium's products, pricing, integrations, or support.",
                grounded=False,
                confidence=1.0,
                citations=[],
                model={"provider": "none", "model": "none"},
                usage={"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0},
                refusal=False,
                latency_ms=int((time.perf_counter() - start) * 1000),
            )

        # 2. memory hydration
        session_turns: list[dict] = []
        convo_summary: str | None = None
        user_memory: dict = {}
        workspace_memory: list[dict] = []
        if ctx.session_id:
            session_turns = await self.memory.session_memory(
                str(ctx.tenant_id), str(ctx.session_id), max_turns=6
            )
            convo_summary = await self.memory.conversation_summary(str(ctx.tenant_id), str(ctx.session_id))
        user_memory = await self.memory.user_memory(str(ctx.tenant_id), str(ctx.user_id))
        workspace_memory = await self.memory.workspace_memory(str(ctx.tenant_id))

        memory_parts: list[dict] = []
        if convo_summary:
            memory_parts.append({"role": "system", "content": f"Conversation summary: {convo_summary}"})
        memory_parts.extend(session_turns)
        for key, value in user_memory.items():
            memory_parts.append({"role": "user", "content": f"(User context) {key}: {value}"})

        # 3. rewrite + multi-query
        with tracer().start_as_current_span("query.rewrite"):
            rewritten = await rewrite_query(
                self.gateway, ctx.question, context=convo_summary, enabled=ctx.options.use_rewrite and settings.search_use_query_rewrite
            )
        with tracer().start_as_current_span("query.multi"):
            queries = await multi_query_expand(
                self.gateway, rewritten, enabled=ctx.options.use_multi_query and settings.search_use_multi_query
            )

        # 4. hybrid retrieval
        retrieval = await self.retrieval.search(
            queries=queries,
            filters=filters,
            rerank=ctx.options.rerank,
            use_keyword=ctx.options.mode in {"hybrid", "keyword"},
        )

        # 5. confidence
        rerank_scores = [c.rerank_score for c in retrieval.chunks if c.rerank_score is not None]
        if rerank_scores:
            agreement = 1.0 if len(queries) == 1 else 0.85
            confidence = confidence_score(
                ConfidenceInput(
                    rerank_scores=rerank_scores,
                    agreement=agreement,
                    freshness=1.0,
                )
            )
        else:
            confidence = 0.0 if not retrieval.chunks else min(0.5, max(c.score for c in retrieval.chunks))
        confidence_hist.record(confidence)

        # 6. context compression (retained top chunks, sanitized)
        context = retrieval.to_context(max_chars=ctx.options.max_context_chars)
        for chunk in context:
            chunk["text"] = sanitize_context_chunk(chunk["text"])

        # 7. refusal path
        threshold = settings.retrieval_confidence_threshold
        if not context or confidence < threshold:
            refusal_answer = "I couldn't find a reliable answer in the available sources."
            result = PipelineResult(
                answer=refusal_answer,
                grounded=False,
                confidence=confidence,
                citations=[self._citation_from_chunk(c) for c in retrieval.chunks[:3]],
                model={"provider": "none", "model": "none"},
                usage={"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0},
                refusal=True,
                rewrites=queries,
                latency_ms=int((time.perf_counter() - start) * 1000),
            )
            grounded_counter.add(1, {"result": "refused"})
            return result

        # 8. synthesis
        with tracer().start_as_current_span("query.synthesize"):
            prompt_ctx = PromptContext(
                question=ctx.question,
                context_chunks=context,
                memory=memory_parts,
                workspace_memory=workspace_memory,
                intent=intent.value,
            )
            messages = build_synthesis_messages(prompt_ctx)
            completion = await self.gateway.complete(
                messages,
                role="default",
                max_tokens=settings.llm_max_tokens,
            )
        answer = completion.text.strip()

        # 9. grounding + validation
        with tracer().start_as_current_span("query.validate"):
            grounded, unsupported = self.verifier.verify(answer, context)
            validation = (
                validate_citations(self._citation_dicts(context))
                if grounded
                else _ok_validation()
            )
            validation = validation.merge(validate_length(answer))
            validation = validation.merge(validate_refusal_mismatch(answer, confidence, threshold))

        citations = self._citation_dicts(context)[:8]
        if not grounded or not validation.valid:
            hallucination_counter.add(1)
            logger.warning("answer_rejected", unsupported=unsupported[:3], reasons=validation.reasons)

        result = PipelineResult(
            answer=answer if (grounded and validation.valid) else "I couldn't find a reliable answer in the available sources.",
            grounded=grounded and validation.valid,
            confidence=confidence,
            citations=[Citation(**c) for c in citations],
            model={"provider": completion.extra.get("provider", self.gateway.spec_for().provider), "model": self.gateway.spec_for().model},
            usage=completion.usage,
            rewrites=queries,
            latency_ms=int((time.perf_counter() - start) * 1000),
        )
        grounded_counter.add(1, {"result": "grounded" if result.grounded else "flagged"})
        tokens_counter.add(completion.usage["total_tokens"], {"provider": result.model["provider"], "model": result.model["model"]})
        answer_latency.record(result.latency_ms / 1000)
        return result

    async def stream(self, ctx: QueryContext) -> "StreamController":
        controller = StreamController(self, ctx)
        await controller.start()
        return controller

    @staticmethod
    def _citation_from_chunk(chunk) -> Citation:
        return Citation(
            chunk_id=uuid.UUID(chunk.id) if _is_uuid(chunk.id) else uuid.uuid5(uuid.NAMESPACE_URL, chunk.id),
            url=chunk.payload.get("url") or "unknown",
            heading=chunk.payload.get("heading") or chunk.payload.get("section_path"),
            snippet=chunk.text[:220],
            score=chunk.score,
        )

    @staticmethod
    def _citation_dicts(context: list[dict]) -> list[dict]:
        out = []
        for c in context:
            cid = c.get("id")
            out.append(
                {
                    "chunk_id": cid if _is_uuid(str(cid)) else uuid.uuid5(uuid.NAMESPACE_URL, str(cid)),
                    "url": c.get("url") or "unknown",
                    "heading": c.get("heading"),
                    "snippet": c.get("text", "")[:220],
                    "score": c.get("score"),
                }
            )
        return out


def _is_uuid(value: str) -> bool:
    try:
        uuid.UUID(value)
        return True
    except (ValueError, TypeError):
        return False


def _ok_validation():
    from application.pipeline.validator import ValidationResult

    return ValidationResult(valid=True, reasons=[])


class StreamController:
    """Streaming variant of the pipeline. Runs the non-stream path but emits SSE-style events."""

    def __init__(self, pipeline: QueryPipeline, ctx: QueryContext) -> None:
        self.pipeline = pipeline
        self.ctx = ctx
        self.events: list[dict] = []

    async def start(self) -> None:
        result = await self.pipeline.run(self.ctx)
        self.result = result
        self.events.append({"event": "done", "data": json.dumps(
            {
                "answer": result.answer,
                "grounded": result.grounded,
                "confidence": result.confidence,
                "citations": [c.model_dump() for c in result.citations],
                "model": result.model,
                "usage": result.usage,
                "refusal": result.refusal,
            }
        )})
