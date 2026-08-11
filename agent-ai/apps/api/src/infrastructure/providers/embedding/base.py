from __future__ import annotations

from typing import Protocol


class EmbeddingProvider(Protocol):
    name: str
    dim: int

    async def embed(self, texts: list[str], *, batch_size: int = 32) -> list[list[float]]: ...

    async def embed_query(self, text: str) -> list[float]: ...
