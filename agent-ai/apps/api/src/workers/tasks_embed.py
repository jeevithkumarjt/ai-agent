from __future__ import annotations

import asyncio
import uuid
from typing import Any

from qdrant_client import models

from config import settings
from logging import get_logger
from telemetry import counter, histogram

from .celery_app import celery_app
from .runtime import async_app, run_async

logger = get_logger("tasks.embed")

chunks_embedded = counter("agentai_ingest_chunks_embedded_total", "Chunks embedded")
embed_duration = histogram("agentai_embed_duration_seconds", "Embedding duration", "seconds")


async def _embed_and_index(chunk_ids: list[str], document_id: str, tenant_id: str, source_id: str, doc_version: int) -> dict:
    import time

    start = time.perf_counter()
    async with async_app() as session:
        from domain.models import Chunk, Document
        from infrastructure.providers.embedding.gateway import default_embedding_gateway
        from infrastructure.providers.vector.qdrant import QdrantVectorStore
        from infrastructure.repository.document_repo import ChunkRepository
        from sqlalchemy import select

        embeddings = default_embedding_gateway()
        vector_store = QdrantVectorStore()
        chunk_repo = ChunkRepository(session)

        collection = f"w_{tenant_id}"
        await vector_store.ensure_collection(name=collection, dim=embeddings.dim)

        doc = (
            await session.execute(select(Document).where(Document.id == uuid.UUID(document_id)))
        ).scalar_one_or_none()

        stmt = select(Chunk).where(Chunk.id.in_([uuid.UUID(c) for c in chunk_ids]))
        chunks = list((await session.execute(stmt)).scalars().all())
        if not chunks:
            return {"status": "no_chunks"}

        published_ts = int(doc.published_at.timestamp()) if (doc and doc.published_at) else None
        url = doc.canonical_url if doc else ""

        texts = [c.text for c in chunks]
        result = await embeddings.embed(texts)
        points: list[Any] = []
        for chunk, vector in zip(chunks, result.vectors):
            points.append(
                models.PointStruct(
                    id=str(chunk.id),
                    vector={"dense": vector},
                    payload={
                        "chunk_id": str(chunk.id),
                        "document_id": str(chunk.document_id),
                        "source_id": source_id,
                        "tenant_id": tenant_id,
                        "source_version": doc_version,
                        "doc_version": chunk.doc_version,
                        "text": chunk.text[:4000],
                        "url": url,
                        "heading": chunk.heading,
                        "section_path": chunk.section_path,
                        "content_type": doc.content_type if doc else None,
                        "lang": chunk.lang,
                        "published_at": published_ts,
                    },
                )
            )
            chunk.embedded = True

        await vector_store.upsert(collection=collection, points=points)
        await session.flush()

        from infrastructure.repository.source_repo import SourceRepository

        source_repo = SourceRepository(session)
        new_version = await source_repo.bump_version(uuid.UUID(source_id))

        from application.services.cache import invalidate_tenant

        await invalidate_tenant(tenant_id, source_id)

        from .tasks_eval import run_eval

        run_eval.apply_async(args=[tenant_id, "post_ingest"], queue="eval")

        chunks_embedded.add(len(points))
        embed_duration.record(time.perf_counter() - start)
        logger.info("chunks_indexed", chunks=len(points), document_id=document_id, source_version=new_version)
        return {"status": "indexed", "chunks": len(points), "source_version": new_version}


@celery_app.task(name="workers.tasks_embed.embed_and_index", bind=True, autoretry_for=(Exception,), retry_backoff=True, retry_backoff_max=120)
def embed_and_index(self, chunk_ids: list[str], document_id: str, tenant_id: str, source_id: str, doc_version: int) -> dict:
    return run_async(lambda: _embed_and_index(chunk_ids, document_id, tenant_id, source_id, doc_version))
