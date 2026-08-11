from __future__ import annotations

from typing import Any

from qdrant_client import AsyncQdrantClient, models

from config import settings
from domain.errors import DependencyUnavailableError
from logging import get_logger

logger = get_logger("vector.qdrant")

COLLECTION_PREFIX = "agentai"


def _scalar_filter(filters: dict) -> models.Filter:
    """Convert a flat payload filter dict into a Qdrant Filter.

    Supported operators per field: {value}, {gt}, {lt}, {gte}, {lte}, {in}.
    """
    must: list[models.FieldCondition] = []
    for field, spec in filters.items():
        if isinstance(spec, dict) and any(k in spec for k in ("gt", "lt", "gte", "lte", "in")):
            if "in" in spec:
                must.append(
                    models.FieldCondition(
                        key=field, match=models.MatchAny(any=[str(v) for v in spec["in"]])
                    )
                )
            else:
                ranges = {}
                for op in ("gt", "lt", "gte", "lte"):
                    if op in spec:
                        ranges[op] = spec[op]
                must.append(models.FieldCondition(key=field, range=models.Range(**ranges)))
        else:
            must.append(models.FieldCondition(key=field, match=models.MatchValue(value=str(spec))))
    return models.Filter(must=must)


class QdrantVectorStore:
    """Qdrant adapter. Sparse (SPLADE/BM25-style) vectors live in the same point."""

    def __init__(self, url: str | None = None, api_key: str | None = None) -> None:
        self._client = AsyncQdrantClient(
            url=url or settings.qdrant_url,
            api_key=api_key or settings.qdrant_api_key or None,
            timeout=30,
        )
        self._collection: str | None = None

    def _name(self, collection: str) -> str:
        return f"{COLLECTION_PREFIX}_{collection}"

    async def ensure_collection(self, *, name: str, dim: int, sparse: bool = False) -> None:
        full = self._name(name)
        if await self.collection_exists(name=name):
            return
        vectors_config: dict[str, Any] = {
            "dense": models.VectorParams(size=dim, distance=models.Distance.COSINE)
        }
        sparse_vectors_config: dict[str, Any] = {}
        if sparse:
            sparse_vectors_config["sparse"] = models.SparseVectorParams()
        await self._client.create_collection(
            collection_name=full,
            vectors_config=vectors_config,
            sparse_vectors_config=sparse_vectors_config or None,
        )
        await self._client.create_payload_index(
            collection_name=full, field_name="tenant_id", field_schema="keyword"
        )
        await self._client.create_payload_index(
            collection_name=full, field_name="source_version", field_schema="integer"
        )
        await self._client.create_payload_index(
            collection_name=full, field_name="doc_version", field_schema="integer"
        )
        await self._client.create_payload_index(
            collection_name=full, field_name="content_type", field_schema="keyword"
        )
        await self._client.create_payload_index(
            collection_name=full, field_name="lang", field_schema="keyword"
        )
        await self._client.create_payload_index(
            collection_name=full, field_name="published_at", field_schema="datetime"
        )
        logger.info("qdrant_collection_ready", collection=full)

    async def collection_exists(self, *, name: str) -> bool:
        full = self._name(name)
        exists = await self._client.collection_exists(full)
        if not exists:
            # Guard for very old client behavior
            try:
                await self._client.get_collection(full)
                return True
            except Exception:
                return False
        return exists

    async def upsert(self, *, collection: str, points: list[Any]) -> None:
        if not points:
            return
        full = self._name(collection)
        await self._client.upsert(collection_name=full, points=points)

    async def delete(self, *, collection: str, ids: list[str]) -> None:
        if not ids:
            return
        full = self._name(collection)
        await self._client.delete(
            collection_name=full,
            points_selector=models.PointIdsList(point_ids=[models.PointId(point_id) for point_id in ids]),
        )

    async def delete_by_filter(self, *, collection: str, must: list[dict]) -> None:
        full = self._name(collection)
        conds = [models.FieldCondition(key=c["key"], match=models.MatchValue(value=str(c["value"]))) for c in must]
        await self._client.delete(
            collection_name=full,
            points_selector=models.FilterSelector(filter=models.Filter(must=conds)),
        )

    async def search_dense(
        self, *, collection: str, vector: list[float], filters: dict, limit: int
    ) -> list[dict]:
        full = self._name(collection)
        result = await self._client.query_points(
            collection_name=full,
            query=vector,
            using="dense",
            query_filter=_scalar_filter(filters) if filters else None,
            limit=limit,
            with_payload=True,
        )
        return [self._hit(r) for r in result.points]

    async def search_sparse(
        self,
        *,
        collection: str,
        indices: list[int],
        values: list[float],
        filters: dict,
        limit: int,
    ) -> list[dict]:
        full = self._name(collection)
        result = await self._client.query_points(
            collection_name=full,
            query=models.SparseVector(indices=indices, values=values),
            using="sparse",
            query_filter=_scalar_filter(filters) if filters else None,
            limit=limit,
            with_payload=True,
        )
        return [self._hit(r) for r in result.points]

    async def count(self, *, collection: str, filters: dict | None = None) -> int:
        full = self._name(collection)
        result = await self._client.count(
            collection_name=full,
            count_filter=_scalar_filter(filters) if filters else None,
            exact=True,
        )
        return result.count

    async def delete_collection(self, *, name: str) -> None:
        full = self._name(name)
        await self._client.delete_collection(full)

    async def close(self) -> None:
        await self._client.close()

    @staticmethod
    def _hit(r) -> dict:
        return {
            "id": str(r.id),
            "score": r.score,
            "payload": r.payload or {},
        }

    async def healthcheck(self) -> bool:
        try:
            await self._client.get_collections()
            return True
        except Exception:
            return False
