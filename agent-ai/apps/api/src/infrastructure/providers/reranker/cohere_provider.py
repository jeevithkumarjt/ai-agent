from __future__ import annotations

from typing import AsyncIterator
from urllib.parse import quote

from .base import RerankerProvider, ScoredDocument


class CohereReranker:
    """Hosted Cohere Rerank behind the same reranker interface."""

    name = "cohere"

    def __init__(self, api_key: str, model: str = "rerank-multilingual-v3.0", top_n: int = 8):
        self._api_key = api_key
        self._model = model
        self._top_n = top_n

    async def rerank(self, query: str, documents: list[str], *, top_k: int) -> list[ScoredDocument]:
        import httpx

        payload = {
            "model": self._model,
            "query": query,
            "documents": documents,
            "top_n": top_k,
        }
        async with httpx.AsyncClient(timeout=60) as client:
            resp = await client.post(
                "https://api.cohere.ai/v2/rerank",
                headers={"Authorization": f"Bearer {self._api_key}"},
                json=payload,
            )
            resp.raise_for_status()
            data = resp.json()
        results = data.get("results", [])
        ranked = [
            ScoredDocument(text=documents[r["index"]], score=float(r.get("relevance_score", 0.0)))
            for r in results
        ]
        return ranked[:top_k]


async def _noop_stream() -> AsyncIterator[str]:
    yield ""
    return
