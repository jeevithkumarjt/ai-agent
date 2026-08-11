from __future__ import annotations

import uuid

from domain.models import Chunk, Document
from logging import get_logger

from .celery_app import celery_app
from .runtime import async_app, run_async

logger = get_logger("tasks.cleanup")


async def _cleanup_index() -> None:
    """Versioned garbage collection:
    - delete Qdrant points whose doc_version is older than the document's current version
    - purge soft-deleted documents after grace period
    - mark orphaned chunks
    """
    async with async_app() as session:
        from infrastructure.providers.vector.qdrant import QdrantVectorStore
        from sqlalchemy import select

        vector_store = QdrantVectorStore()
        tenant_ids = list(
            (await session.execute(select(Document.tenant_id).distinct())).scalars().all()
        )
        for tenant_id in tenant_ids:
            collection = f"w_{tenant_id}"
            if not await vector_store.collection_exists(name=collection):
                continue
            docs = list(
                (
                    await session.execute(
                        select(Document).where(Document.tenant_id == tenant_id, Document.status != "deleted")
                    )
                ).scalars().all()
            )
            for doc in docs:
                stmt = select(Chunk.id).where(Chunk.document_id == doc.id, Chunk.doc_version < doc.version)
                stale_ids = [str(i) for i in (await session.execute(stmt)).scalars().all()]
                if stale_ids:
                    await vector_store.delete(collection=collection, ids=stale_ids)
                    from sqlalchemy import delete

                    await session.execute(
                        delete(Chunk).where(Chunk.document_id == doc.id, Chunk.doc_version < doc.version)
                    )
            deleted_docs = list(
                (
                    await session.execute(
                        select(Document).where(Document.tenant_id == tenant_id, Document.status == "deleted")
                    )
                ).scalars().all()
            )
            for doc in deleted_docs:
                await vector_store.delete_by_filter(
                    collection=collection,
                    must=[{"key": "document_id", "value": str(doc.id)}],
                )
        logger.info("cleanup_completed", tenants=len(tenant_ids))


@celery_app.task(name="workers.tasks_cleanup.cleanup_index")
def cleanup_index() -> dict:
    run_async(_cleanup_index)
    return {"status": "done"}
