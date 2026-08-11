from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol


@dataclass
class ScoredDocument:
    text: str
    score: float
    metadata: dict | None = None


class RerankerProvider(Protocol):
    name: str

    async def rerank(self, query: str, documents: list[str], *, top_k: int) -> list[ScoredDocument]: ...


class FastEmbedReranker:
    """Local cross-encoder reranking (default BAAI/bge-reranker-v2-m3) via ONNX."""

    name = "fastembed"

    def __init__(self) -> None:
        self._model = None

    def _get_model(self):
        if self._model is None:
            try:
                from fastembed import TextReranker
            except ImportError as exc:
                from domain.errors import DependencyUnavailableError

                raise DependencyUnavailableError("fastembed not installed") from exc
            from config import settings

            self._model = TextReranker(model_name=settings.reranker_model, cache_dir=None)
        return self._model

    async def rerank(self, query: str, documents: list[str], *, top_k: int) -> list[ScoredDocument]:
        if not documents:
            return []
        import asyncio

        def run() -> list:
            return list(self._get_model().rerank(query, documents))

        scores = await asyncio.to_thread(run)
        ranked = sorted(
            (ScoredDocument(text=documents[i], score=float(s)) for i, s in enumerate(scores)),
            key=lambda d: d.score,
            reverse=True,
        )
        return ranked[:top_k]
