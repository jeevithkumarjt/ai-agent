from __future__ import annotations

import asyncio

from config import settings
from domain.errors import DependencyUnavailableError
from logging import get_logger

from .base import EmbeddingProvider

logger = get_logger("embedding.fastembed")


class FastEmbedProvider(EmbeddingProvider):
    """Local ONNX embeddings (default: BAAI/bge-m3) — zero marginal cost, offline, multilingual.

    Inference is CPU-bound, so it runs inside an executor to avoid blocking the event loop.
    """

    name = "fastembed"
    dim: int

    def __init__(self) -> None:
        self.dim = settings.embedding_dim
        self._model = None

    def _get_model(self):
        if self._model is None:
            try:
                from fastembed import TextEmbedding
            except ImportError as exc:
                raise DependencyUnavailableError("fastembed not installed") from exc
            self._model = TextEmbedding(model_name=settings.embedding_model, cache_dir=None)
        return self._model

    async def embed(self, texts: list[str], *, batch_size: int | None = None) -> list[list[float]]:
        if not texts:
            return []
        batch = batch_size or settings.embedding_batch_size
        truncated = [t[: settings.embedding_max_chars] for t in texts]
        try:
            vectors = await asyncio.to_thread(self._run, truncated, batch)
            return [v.tolist() for v in vectors]
        except Exception as exc:
            raise DependencyUnavailableError("fastembed inference failed", cause=exc) from exc

    def _run(self, texts: list[str], batch_size: int) -> list:
        model = self._get_model()
        out: list = []
        for i in range(0, len(texts), batch_size):
            out.extend(model.embed(list(texts[i : i + batch_size])))
        return out

    async def embed_query(self, text: str) -> list[float]:
        result = await self.embed([text], batch_size=1)
        return result[0]
