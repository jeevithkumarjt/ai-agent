"""search_knowledge_base — the one real tool in phase 1.

Runs RAG retrieval scoped to the caller's tenant (ADR-004) and returns the top-k
chunks as text for the model to reason over. Returned chunks are capped so the
tool result stays within the model's context budget.
"""
from __future__ import annotations

import uuid
from typing import Any

from core.logging import get_logger
from core.settings import settings
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from services.rag import RagService
from services.tools.base import BaseTool, ToolResult

logger = get_logger("services.tools.search_knowledge_base")

MAX_RESULT_CHARS = 12000


class SearchKnowledgeBaseInput(BaseModel):
    query: str = Field(description="Semantic search query, natural language.")
    top_k: int = Field(default=settings.retrieval_top_k, ge=1, le=20, description="Number of chunks to retrieve.")


class SearchKnowledgeBaseTool(BaseTool):
    name = "search_knowledge_base"
    description = (
        "Search the organization's knowledge base using semantic (vector) retrieval. "
        "Use this whenever the answer may live in internal documents, policies, or FAQ."
    )
    input_schema = SearchKnowledgeBaseInput

    def __init__(self, rag: RagService) -> None:
        self.rag = rag

    async def execute(self, *, tenant_id: uuid.UUID, session: AsyncSession, **kwargs: Any) -> ToolResult:
        validated = self.input_schema(**kwargs)
        query = validated.query.strip()
        if not query:
            return ToolResult(content="Error: `query` must be non-empty.")

        if not settings.embeddings_api_key:
            # The LocalHash fallback is only for local dev/tests — never pretend
            # its results are real semantic retrieval for a customer-facing answer.
            logger.warning(
                "tool_search_no_embeddings",
                reason="EMBEDDINGS_API_KEY not configured; vector retrieval is not meaningful",
            )
            return ToolResult(
                content=(
                    "No real embeddings endpoint is configured, so semantic search is disabled. "
                    "Answer only from the knowledge already provided in the system prompt, and "
                    "if it does not contain the answer, say so plainly."
                ),
                sources=[],
            )

        chunks = await self.rag.search(session, tenant_id=tenant_id, query=query, top_k=validated.top_k)
        if not chunks:
            return ToolResult(content="No relevant documents found in the knowledge base.")

        parts = []
        sources = []
        for i, chunk in enumerate(chunks, start=1):
            source = (chunk.chunk_metadata or {}).get("source_id", chunk.source_id)
            sources.append(source)
            parts.append(f"[{i}] source: {source}\n{chunk.chunk_text}")
        body = "\n\n---\n\n".join(parts)
        if len(body) > MAX_RESULT_CHARS:
            body = body[:MAX_RESULT_CHARS] + "\n…(truncated)"
        return ToolResult(content=body, sources=sources)
