from __future__ import annotations

from dataclasses import dataclass

from config import settings
from domain.errors import DependencyUnavailableError

from .base import FastEmbedReranker, RerankerProvider
from .cohere_provider import CohereReranker


@dataclass
class RerankResult:
    items: list
    provider: str
    model: str


class RerankerGateway:
    def __init__(self) -> None:
        self._provider: RerankerProvider | None = None

    def _resolve(self) -> RerankerProvider:
        if self._provider is None:
            if settings.reranker_provider == "cohere":
                self._provider = CohereReranker(api_key=settings.openai_api_key or "")
            else:
                self._provider = FastEmbedReranker()
        return self._provider

    async def rerank(self, query: str, documents: list[str], *, top_k: int | None = None) -> RerankResult:
        k = top_k or settings.retrieval_rerank_top_k
        try:
            items = await self._resolve().rerank(query, documents, top_k=k)
        except DependencyUnavailableError:
            raise
        return RerankResult(items=items, provider=self._resolve().name, model=settings.reranker_model)


def default_reranker_gateway() -> RerankerGateway:
    return RerankerGateway()
