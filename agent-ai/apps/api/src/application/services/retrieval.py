from __future__ import annotations

import time
from dataclasses import dataclass, field

from config import settings
from db.redis import get_redis
from infrastructure.providers.embedding.gateway import EmbeddingGateway
from infrastructure.providers.reranker.gateway import RerankerGateway
from infrastructure.providers.vector.base import VectorStore
from infrastructure.search.filters import RetrievalFilters
from infrastructure.search.fusion import reciprocal_rank_fusion
from infrastructure.search.mmr import mmr_select
from infrastructure.search.sparse import BM25KeywordIndex
from logging import get_logger
from telemetry import counter, histogram, tracer

logger = get_logger("retrieval")

retrieval_latency = histogram("agentai_retrieval_latency_seconds", "Hybrid retrieval latency", "seconds")
cache_hit_counter = counter("agentai_retrieval_cache_hits_total", "Retrieval cache hits")
cache_miss_counter = counter("agentai_retrieval_cache_misses_total", "Retrieval cache misses")


@dataclass
class RetrievedChunk:
    id: str
    text: str
    payload: dict
    score: float = 0.0
    rerank_score: float | None = None
    sources: list[str] = field(default_factory=list)


@dataclass
class RetrievalResult:
    chunks: list[RetrievedChunk]
    query_rewrites: list[str]
    latency_ms: int
    cache_hit: bool = False

    @property
    def confidence_signal(self) -> list[float]:
        return [c.rerank_score for c in self.chunks if c.rerank_score is not None] or [c.score for c in self.chunks]

    def to_context(self, max_chars: int = 8000) -> list[dict]:
        context: list[dict] = []
        total = 0
        for chunk in self.chunks:
            text = chunk.text
            if total + len(text) > max_chars:
                break
            context.append(
                {
                    "id": chunk.id,
                    "text": text,
                    "url": chunk.payload.get("url"),
                    "heading": chunk.payload.get("heading"),
                    "section_path": chunk.payload.get("section_path"),
                    "score": chunk.rerank_score if chunk.rerank_score is not None else chunk.score,
                }
            )
            total += len(text)
        return context


class RetrievalService:
    def __init__(
        self,
        vector_store: VectorStore,
        embeddings: EmbeddingGateway,
        reranker: RerankerGateway,
    ) -> None:
        self.vector_store = vector_store
        self.embeddings = embeddings
        self.reranker = reranker
        self._keyword = BM25KeywordIndex()

    async def search(
        self,
        *,
        queries: list[str],
        filters: RetrievalFilters,
        top_k: int | None = None,
        rerank: bool = True,
        use_keyword: bool = True,
        use_mmr: bool = True,
    ) -> RetrievalResult:
        start = time.perf_counter()
        collection = f"w_{filters.tenant_id}"
        await self.vector_store.ensure_collection(name=collection, dim=self.embeddings.dim, sparse=False)

        cache_key = self._cache_key(queries, filters, top_k, rerank)
        cached = await self._get_cached(cache_key)
        if cached is not None and not rerank:
            cache_hit_counter.add(1)
            result = self._from_cache(cached)
            result.cache_hit = True
            result.latency_ms = int((time.perf_counter() - start) * 1000)
            return result
        cache_miss_counter.add(1)

        k = top_k or settings.retrieval_top_k
        dense_lists: list[list[dict]] = []
        keyword_lists: list[list[dict]] = []
        payload = filters.as_payload()

        with tracer().start_as_current_span("query.retrieve"):
            for query in queries:
                vector = await self.embeddings.embed_query(query)
                dense = await self.vector_store.search_dense(
                    collection=collection, vector=vector, filters=payload, limit=k
                )
                for item in dense:
                    item["source"] = "dense"
                dense_lists.append(dense)

                if use_keyword:
                    kw = await self._keyword_search(query, filters, top_k=k)
                    for item in kw:
                        item["source"] = "keyword"
                    keyword_lists.append(kw)

            fused = reciprocal_rank_fusion([*dense_lists, *keyword_lists], k=settings.retrieval_rrf_k)

        if use_mmr and len(fused) > settings.retrieval_rerank_top_k:
            fused = mmr_select(fused, lambda_param=settings.retrieval_mmr_lambda, top_k=settings.retrieval_mmr_top_k)

        if rerank and fused:
            documents = [str(item["payload"].get("text", "")) for item in fused]
            reranked = await self.reranker.rerank(queries[0], documents, top_k=settings.retrieval_rerank_top_k)
            rerank_scores = {item.text: item.score for item in reranked.items}
            fused = [item for item in fused if str(item["payload"].get("text", "")) in rerank_scores]
            for item in fused:
                item["rerank_score"] = rerank_scores[str(item["payload"].get("text", ""))]
            fused = sorted(fused, key=lambda i: float(i["rerank_score"]), reverse=True)

        chunks = [
            RetrievedChunk(
                id=item["id"],
                text=str(item["payload"].get("text", "")),
                payload=item["payload"],
                score=float(item.get("score", 0.0)),
                rerank_score=item.get("rerank_score"),
                sources=item.get("sources", []),
            )
            for item in fused
        ]

        result = RetrievalResult(
            chunks=chunks,
            query_rewrites=queries,
            latency_ms=int((time.perf_counter() - start) * 1000),
        )
        retrieval_latency.record(result.latency_ms / 1000)
        if not rerank:
            await self._set_cached(cache_key, result)
        return result

    async def _keyword_search(self, query: str, filters: RetrievalFilters, *, top_k: int) -> list[dict]:
        corpus_key = f"agentai:{filters.tenant_id}:kw:{filters.source_version}"
        redis = get_redis()
        raw = await redis.get(corpus_key)
        if raw is None:
            return []
        import json as _json

        items = _json.loads(raw)
        index = BM25KeywordIndex().build(items)
        candidates = index.search(query, top_k=top_k)
        return [
            {"id": c.id, "score": c.score, "payload": c.payload, "text": c.text, "source": "keyword"}
            for c in candidates
        ]

    @staticmethod
    def _cache_key(queries: list[str], filters: RetrievalFilters, top_k: int | None, rerank: bool) -> str:
        import hashlib

        raw = f"{queries}|{filters.as_payload()}|{top_k}|{rerank}".encode()
        digest = hashlib.sha256(raw).hexdigest()
        return f"agentai:{filters.tenant_id}:cache:retrieval:{digest}"

    async def _get_cached(self, key: str) -> list[dict] | None:
        if not settings.cache_enabled:
            return None
        import json as _json

        raw = await get_redis().get(key)
        return _json.loads(raw) if raw else None

    async def _set_cached(self, key: str, result: RetrievalResult) -> None:
        if not settings.cache_enabled:
            return
        import json as _json

        payload = [
            {"id": c.id, "text": c.text, "payload": c.payload, "score": c.score}
            for c in result.chunks
        ]
        await get_redis().set(key, _json.dumps(payload), ex=settings.cache_retrieval_ttl)

    @staticmethod
    def _from_cache(cached: list[dict]) -> RetrievalResult:
        chunks = [
            RetrievedChunk(id=c["id"], text=c["text"], payload=c["payload"], score=c["score"])
            for c in cached
        ]
        return RetrievalResult(chunks=chunks, query_rewrites=[], latency_ms=0)
