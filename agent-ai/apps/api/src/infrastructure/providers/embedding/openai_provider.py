from __future__ import annotations

import httpx

from config import settings
from domain.errors import DependencyUnavailableError

from .base import EmbeddingProvider

_EMBED_URL = "https://api.openai.com/v1/embeddings"


class OpenAIEmbeddingProvider(EmbeddingProvider):
    """Hosted embeddings via the OpenAI-compatible wire protocol (OpenAI / Azure / Mistral)."""

    name = "openai"
    dim: int

    def __init__(self, *, api_key: str, base_url: str | None = None, model: str = "text-embedding-3-large", dim: int = 3072):
        self.dim = dim
        self._api_key = api_key
        self._base_url = (base_url or _EMBED_URL).rstrip("/")
        self._model = model

    async def embed(self, texts: list[str], *, batch_size: int = 32) -> list[list[float]]:
        out: list[list[float]] = []
        async with httpx.AsyncClient(timeout=60) as client:
            for i in range(0, len(texts), batch_size):
                payload = {
                    "model": self._model,
                    "input": [t[: settings.embedding_max_chars] for t in texts[i : i + batch_size]],
                }
                resp = await client.post(
                    f"{self._base_url}/embeddings",
                    headers={"Authorization": f"Bearer {self._api_key}"},
                    json=payload,
                )
                resp.raise_for_status()
                data = resp.json()
                out.extend([item["embedding"] for item in data["data"]])
        return out

    async def embed_query(self, text: str) -> list[float]:
        result = await self.embed([text], batch_size=1)
        return result[0]
