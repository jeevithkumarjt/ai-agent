from __future__ import annotations

from dataclasses import dataclass

from config import settings
from domain.errors import DependencyUnavailableError
from logging import get_logger

from .base import EmbeddingProvider
from .fastembed_provider import FastEmbedProvider
from .openai_provider import OpenAIEmbeddingProvider

logger = get_logger("embedding.gateway")


@dataclass
class EmbeddingResult:
    vectors: list[list[float]]
    provider: str
    model: str
    dim: int


class EmbeddingGateway:
    """Provider abstraction: fastembed local by default; hosted options behind the same interface."""

    def __init__(self) -> None:
        self._provider: EmbeddingProvider | None = None
        self._model = settings.embedding_model

    def _resolve(self) -> EmbeddingProvider:
        if self._provider is None:
            if settings.embedding_provider == "openai":
                self._provider = OpenAIEmbeddingProvider(
                    api_key=settings.openai_api_key or "",
                    base_url=settings.openai_base_url,
                    model=self._model,
                )
            else:
                self._provider = FastEmbedProvider()
        return self._provider

    @property
    def dim(self) -> int:
        return self._resolve().dim

    async def embed(self, texts: list[str], *, batch_size: int | None = None) -> EmbeddingResult:
        try:
            vectors = await self._resolve().embed(texts, batch_size=batch_size)
        except DependencyUnavailableError:
            raise
        return EmbeddingResult(vectors=vectors, provider=self._resolve().name, model=self._model, dim=self._resolve().dim)

    async def embed_query(self, text: str) -> list[float]:
        return await self._resolve().embed_query(text)


def default_embedding_gateway() -> EmbeddingGateway:
    return EmbeddingGateway()
