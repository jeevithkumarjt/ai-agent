"""RAG service (02-agent-and-rag-workflow.md).

Chunking: token-aware, target ~500 tokens with ~50 token overlap (documented).
Retrieval: cosine similarity `embedding <=> :q` against the tenant's chunks only
(ADR-004); flat scan is fine below ~50k rows (ADR-001). Retrieval runs inside the
`search_knowledge_base` tool, never silently prepended to context.
"""
from __future__ import annotations

import re
import uuid

from core.embeddings import Embedder
from core.logging import get_logger
from core.settings import settings
from db.models import DocumentChunk
from sqlalchemy import select
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

    async def ingest_text(self, session: AsyncSession, *, tenant_id: uuid.UUID, source_id: str, text: str, metadata: dict | None = None) -> int:
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

    async def search(self, session: AsyncSession, *, tenant_id: uuid.UUID, query: str, top_k: int | None = None) -> list[DocumentChunk]:
        top_k = top_k or settings.retrieval_top_k
        if top_k < 1:
            return []
        [query_embedding] = await self.embedder.embed([query])
        stmt = (
            select(DocumentChunk, (DocumentChunk.embedding.cosine_distance(query_embedding)).label("distance"))
            .where(DocumentChunk.tenant_id == tenant_id)
            .order_by("distance")
            .limit(top_k)
        )
        results = (await session.execute(stmt)).all()
        return [row[0] for row in results]
