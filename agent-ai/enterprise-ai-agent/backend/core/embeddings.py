"""Embeddings provider (used by RAG ingestion + retrieval, matching vector(1536)).

Provider resolution (documented in 02-agent-and-rag-workflow.md):
  - EMBEDDINGS_API_KEY set  -> OpenAI-compatible /v1/embeddings
  - app_env == "development" -> LocalHash fallback (deterministic, normalized;
    ONLY for local no-key development and tests — retrieval quality is meaningless)
  - otherwise                -> error (missing secret, ADR-007)

Hardening (ADR-007): a hash embedder is explicitly `real=False`. RagService
refuses to persist or query chunks with a non-real embedder, so meaningless
dev-hash vectors can never reach the database or a customer-facing answer.
"""
from __future__ import annotations

import hashlib
import math
from typing import Protocol

import httpx

from core.logging import get_logger
from core.settings import settings

logger = get_logger("core.embeddings")


class Embedder(Protocol):
    real: bool

    async def embed(self, texts: list[str]) -> list[list[float]]: ...


class EmbeddingsError(Exception):
    pass


class OpenAIEmbeddings:
    real = True

    def __init__(self, *, api_key: str, base_url: str | None = None, model: str | None = None, dim: int | None = None) -> None:
        self.api_key = api_key
        self.base_url = (base_url or settings.embeddings_base_url).rstrip("/")
        self.model = model or settings.embeddings_model
        self.dim = dim or settings.embeddings_dim

    async def embed(self, texts: list[str]) -> list[list[float]]:
        if not texts:
            return []
        out: list[list[float]] = []
        async with httpx.AsyncClient(timeout=120) as client:
            for i in range(0, len(texts), settings.embeddings_batch_size):
                batch = texts[i : i + settings.embeddings_batch_size]
                resp = await client.post(
                    f"{self.base_url}/embeddings",
                    headers={"Authorization": f"Bearer {self.api_key}"},
                    json={"model": self.model, "input": batch},
                )
                if resp.status_code != 200:
                    raise EmbeddingsError(f"embeddings request failed: {resp.status_code} {resp.text[:500]}")
                data = resp.json()
                items = sorted(data["data"], key=lambda d: d["index"])
                for item in items:
                    vector = item["embedding"]
                    if len(vector) != self.dim:
                        raise EmbeddingsError(f"unexpected embedding dim {len(vector)} != {self.dim}")
                    out.append(vector)
        return out


class LocalHashEmbeddings:
    """Deterministic pseudo-embeddings for development/tests only.

    `real = False` — RagService refuses to ingest/retrieve with this embedder,
    so hash vectors can never silently pollute the production vector store.
    """

    real = False

    def __init__(self, *, dim: int | None = None) -> None:
        self.dim = dim or settings.embeddings_dim

    async def embed(self, texts: list[str]) -> list[list[float]]:
        return [self._embed_one(t) for t in texts]

    def _embed_one(self, text: str) -> list[float]:
        raw = hashlib.sha256(text.encode("utf-8")).digest()
        total = 0
        vector = []
        for i in range(self.dim):
            seed = int.from_bytes(raw, "big") + i * 2654435761 % (2**64)
            value = (seed >> 32) / (2**32)
            total += value * value
            vector.append(value)
        norm = math.sqrt(total) or 1.0
        return [v / norm for v in vector]


def get_embedder() -> Embedder:
    if settings.embeddings_api_key:
        logger.info("embeddings_provider", provider="openai", model=settings.embeddings_model, dim=settings.embeddings_dim)
        return OpenAIEmbeddings(api_key=settings.embeddings_api_key)
    if settings.app_env == "development":
        logger.warning(
            "embeddings_provider",
            provider="local_hash_fallback",
            reason="no EMBEDDINGS_API_KEY configured; retrieval quality is meaningless in dev",
        )
        return LocalHashEmbeddings()
    raise EmbeddingsError("EMBEDDINGS_API_KEY is not configured (ADR-007)")
