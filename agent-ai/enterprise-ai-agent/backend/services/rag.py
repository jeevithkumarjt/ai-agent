"""RAG service (02-agent-and-rag-workflow.md).

Chunking: token-aware, target ~500 tokens with ~50 token overlap (documented).
Retrieval: hybrid — Postgres tsvector/ts_rank (lexical, BM25-style, GIN-indexed)
blended with pgvector cosine similarity (ADR-001) in a single query against the
tenant's chunks only (ADR-004). `document_chunks` is the single source of truth;
flat scan + sort is fine below ~50k rows (ADR-001). Retrieval runs inside the
`search_knowledge_base` tool and in the orchestrator's system-prompt grounding,
never silently prepended to context beyond that.
"""
from __future__ import annotations

import re
import uuid
from typing import Optional

from core.embeddings import Embedder, EmbeddingsError
from core.logging import get_logger
from core.settings import settings
from db.models import DocumentChunk
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

logger = get_logger("services.rag")

DEFAULT_CHUNK_TOKENS = 500
DEFAULT_OVERLAP_TOKENS = 50


def _tiktoken_encode(text: str) -> list[int] | None:
    """Tokenize if tiktoken is available; return None on char fallback."""
    try:
        import tiktoken

        enc = tiktoken.get_encoding("cl100k_base")
        return enc.encode(text)
    except Exception:
        return None


def _tokens_to_text(tokens: list[int]) -> str:
    try:
        import tiktoken

        enc = tiktoken.get_encoding("cl100k_base")
        return enc.decode(tokens)
    except Exception:
        return "".join(chr(t) for t in tokens if 32 <= t < 0x110000)


def chunk_text(text: str, *, max_tokens: int = DEFAULT_CHUNK_TOKENS, overlap_tokens: int = DEFAULT_OVERLAP_TOKENS) -> list[str]:
    """Split a document into overlapping windows. Token-aware when tiktoken is
    installed (the extra listed under `chunking`); char-based otherwise."""
    text = re.sub(r"\s+", " ", text).strip()
    if not text:
        return []

    tokens = _tiktoken_encode(text)
    if tokens:
        chunks: list[str] = []
        start = 0
        token_count = len(tokens)
        while start < token_count:
            end = min(start + max_tokens, token_count)
            chunk = _tokens_to_text(tokens[start:end]).strip()
            if chunk:
                chunks.append(chunk)
            if end >= token_count:
                break
            start = end - overlap_tokens
        return chunks

    # char-level fallback (no tiktoken): approximate tokens as chars
    step = max(max_tokens - overlap_tokens, 1)
    return [text[i : i + max_tokens] for i in range(0, len(text), step)]


class RagService:
    def __init__(self, embedder: Embedder) -> None:
        self.embedder = embedder

    def _require_real_embeddings(self, *, action: str) -> None:
        if not self.embedder.real:
            # The LocalHash fallback is only for local dev/tests — never pretend
            # its vectors are meaningful semantic retrieval for real data.
            logger.warning(
                "embeddings_not_real",
                action=action,
                reason="embedder is the dev hash fallback; EMBEDDINGS_API_KEY is not configured",
            )
            raise EmbeddingsError(
                f"Cannot {action}: no real embeddings endpoint configured. "
                "Set EMBEDDINGS_API_KEY to an OpenAI-compatible endpoint (e.g. "
                "OpenAI text-embedding-3-small) — hash fallback vectors are meaningless (ADR-007)."
            )

    async def ingest_text(self, session: AsyncSession, *, tenant_id: uuid.UUID, source_id: str, text: str, metadata: dict | None = None) -> int:
        # Refuse to write hash-fallback vectors into the store: once a real
        # endpoint is configured, stale hash rows would be cosine-compared
        # against real embeddings and silently return garbage.
        self._require_real_embeddings(action="ingest chunks")
        chunks = chunk_text(text)
        if not chunks:
            return 0
        embeddings = await self.embedder.embed(chunks)
        meta = metadata or {}
        rows = [
            DocumentChunk(tenant_id=tenant_id, source_id=source_id, chunk_text=c, embedding=emb, chunk_metadata=meta)
            for c, emb in zip(chunks, embeddings, strict=True)
        ]
        session.add_all(rows)
        await session.commit()
        logger.info("ingest_done", source_id=source_id, chunks=len(rows))
        return len(rows)

    async def search(self, session: AsyncSession, *, tenant_id: uuid.UUID, query: str, top_k: int | None = None, *, lexical_only: bool = False) -> list[DocumentChunk]:
        """Hybrid retrieval: lexical (tsvector ts_rank) + vector (cosine) in one query.

        Both signals are computed against the same rows and blended by
        `retrieval_lexical_weight` / `retrieval_vector_weight`. Stopword-only
        queries yield an empty tsquery whose ts_rank is 0, degrading cleanly to
        pure vector search — no special-casing needed. `document_chunks.tsv` is a
        generated column, so the lexical index can never drift from the text.

        If `lexical_only=True` is passed (e.g. when no real embeddings endpoint
        is configured), only the lexical/BM25 signal is used.
        """
        top_k = top_k or settings.retrieval_top_k
        if top_k < 1:
            return []
        if not lexical_only:
            self._require_real_embeddings(action="run semantic search")
        [query_embedding] = await self.embedder.embed([query])
        tsquery = func.websearch_to_tsquery("english", query)
        lexical = func.ts_rank_cd(DocumentChunk.tsv, tsquery) * settings.retrieval_lexical_weight
        if lexical_only:
            stmt = (
                select(DocumentChunk)
                .where(DocumentChunk.tenant_id == tenant_id)
                .order_by(lexical.desc())
                .limit(top_k)
            )
            return list((await session.execute(stmt)).scalars())
        vector = (1 - DocumentChunk.embedding.cosine_distance(query_embedding)) * settings.retrieval_vector_weight
        stmt = (
            select(DocumentChunk)
            .where(DocumentChunk.tenant_id == tenant_id)
            .order_by((lexical + vector).desc())
            .limit(top_k)
        )
        return list((await session.execute(stmt)).scalars())
