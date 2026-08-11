from __future__ import annotations

import asyncio
import uuid

from config import settings
from domain.models import Chunk, CrawlJob, Document
from infrastructure.chunking import chunk_document
from infrastructure.crawler.client import CrawlClient
from infrastructure.crawler.sitemap import fetch_sitemap_index
from infrastructure.crawler.url_utils import (
    is_allowed_scheme,
    normalize_url,
    resolve_relative,
    same_site,
)
from infrastructure.parsers.registry import content_type_of, parser_for
from logging import get_logger
from telemetry import counter, histogram

from .celery_app import celery_app
from .runtime import async_app, run_async

logger = get_logger("tasks.ingest")

pages_fetched = counter("agentai_ingest_pages_total", "Pages crawled by status")
page_duration = histogram("agentai_ingest_duration_seconds", "Per-page ingest duration", "seconds")


def _build_services(session):
    from infrastructure.providers.vector.qdrant import QdrantVectorStore
    from infrastructure.providers.embedding.gateway import default_embedding_gateway
    from infrastructure.repository.document_repo import ChunkRepository, DocumentRepository
    from infrastructure.repository.source_repo import SourceRepository

    return {
        "sources": SourceRepository(session),
        "documents": DocumentRepository(session),
        "chunks": ChunkRepository(session),
        "vector": QdrantVectorStore(),
        "embeddings": default_embedding_gateway(),
    }


async def _discover_and_enqueue(source_id: str, tenant_id: str) -> None:
    async with async_app() as session:
        svc = _build_services(session)
        source = await svc["sources"].get(uuid.UUID(source_id), tenant_id=uuid.UUID(tenant_id))
        config = source.config
        sitemap_url = config.get("sitemap_url")
        base_url = config.get("url")
        if sitemap_url:
            sitemap_url = resolve_relative(base_url, sitemap_url) if base_url else sitemap_url
        elif base_url:
            sitemap_url = resolve_relative(base_url, "sitemap_index.xml")

        client = CrawlClient()
        try:
            entries = await fetch_sitemap_index(client, sitemap_url) if sitemap_url else []
        finally:
            await client.close()

        urls = set()
        for entry in entries:
            url = normalize_url(entry.url, strip_query=config.get("strip_query", False))
            if is_allowed_scheme(url) and same_site(url, base_url or url):
                urls.add(url)
        if not urls and base_url:
            urls.add(normalize_url(base_url))

        job = CrawlJob(tenant_id=source.tenant_id, source_id=source.id, kind="full", status="running", total_pages=len(urls))
        session.add(job)
        await session.flush()

        from .celery_app import celery_app

        for url in urls:
            celery_app.send_task(
                "workers.tasks_ingest.crawl_page",
                args=[url, str(source.id), str(tenant_id)],
                queue="crawl",
            )
        logger.info("crawl_enqueued", source_id=source_id, pages=len(urls))


@celery_app.task(name="workers.tasks_ingest.discover_and_enqueue", bind=True)
def discover_and_enqueue(self, source_id: str, tenant_id: str) -> dict:
    run_async(lambda: _discover_and_enqueue(source_id, tenant_id))
    return {"source_id": source_id, "status": "enqueued"}


async def _crawl_page(url: str, source_id: str, tenant_id: str) -> dict:
    import time

    start = time.perf_counter()
    async with async_app() as session:
        svc = _build_services(session)
        source = await svc["sources"].get(uuid.UUID(source_id), tenant_id=uuid.UUID(tenant_id))
        doc_repo = svc["documents"]
        chunk_repo = svc["chunks"]
        existing = await doc_repo.get_by_url(uuid.UUID(tenant_id), uuid.UUID(source_id), url)

        client = CrawlClient()
        try:
            if not await client.is_allowed(url):
                pages_fetched.add(1, {"status": "disallowed"})
                return {"url": url, "status": "disallowed"}
            result = await client.fetch(url, if_none_match=existing.etag if existing else None)
        finally:
            await client.close()

        if result.status == 304 and existing is not None:
            pages_fetched.add(1, {"status": "unchanged"})
            existing.status = "parsed"
            return {"url": url, "status": "unchanged"}

        if result.status == 404:
            if existing is not None and existing.status != "deleted":
                existing.status = "deleted"
            pages_fetched.add(1, {"status": "gone"})
            return {"url": url, "status": "gone"}

        content_type = content_type_of(result.body, fallback=result.content_type)
        parser = parser_for(content_type)
        parsed = await parser.parse(result.body, url=result.final_url or url)

        doc = existing
        is_new = doc is None
        changed = is_new or doc.sha256 != result.sha256
        if not changed:
            pages_fetched.add(1, {"status": "unchanged"})
            return {"url": url, "status": "unchanged"}

        if is_new:
            doc = Document(
                tenant_id=uuid.UUID(tenant_id),
                source_id=uuid.UUID(source_id),
                canonical_url=url,
                content_type=content_type,
                title=parsed.title,
                lang=parsed.lang,
                sha256=result.sha256,
                etag=result.etag,
                last_modified=result.last_modified,
                status="parsed",
            )
            doc_repo.add(doc)
            await session.flush()
        else:
            doc.version += 1
            doc.sha256 = result.sha256
            doc.etag = result.etag
            doc.last_modified = result.last_modified
            doc.title = parsed.title or doc.title
            doc.lang = parsed.lang or doc.lang
            doc.status = "parsed"
            await session.flush()
            await chunk_repo.delete_for_document(doc.id)

        new_chunks = chunk_document(parsed)
        stored_chunks: list[Chunk] = []
        for chunk in new_chunks:
            row = Chunk(
                tenant_id=doc.tenant_id,
                document_id=doc.id,
                doc_version=doc.version,
                section_path=chunk.section_path,
                heading=chunk.heading,
                text=chunk.text,
                char_offset=chunk.char_offset,
                lang=doc.lang,
                sha256=chunk.sha256,
                embedded=False,
            )
            session.add(row)
            stored_chunks.append(row)
        await session.flush()

        from .celery_app import celery_app

        chunk_ids = [str(c.id) for c in stored_chunks]
        celery_app.send_task(
            "workers.tasks_embed.embed_and_index",
            args=[chunk_ids, str(doc.id), str(tenant_id), str(source_id), doc.version],
            queue="index",
        )
        pages_fetched.add(1, {"status": "changed"})
        page_duration.record(time.perf_counter() - start)
        return {"url": url, "status": "changed", "chunks": len(chunk_ids)}


@celery_app.task(name="workers.tasks_ingest.crawl_page", bind=True, autoretry_for=(Exception,), retry_backoff=True, retry_backoff_max=120)
def crawl_page(self, url: str, source_id: str, tenant_id: str) -> dict:
    try:
        return run_async(lambda: _crawl_page(url, source_id, tenant_id))
    except Exception as exc:
        raise self.retry(exc=exc, countdown=self.default_retry_delay * (self.request.retries + 1))


async def _webhook_refresh(url: str, event: str, tenant_id: str) -> dict:
    """Resolve the owning source for a URL, then run a single-URL incremental refresh."""
    from urllib.parse import urlparse

    from domain.models import KnowledgeSource
    from sqlalchemy import select

    async with async_app() as session:
        host = urlparse(url).netloc.lower()
        sources = list(
            (await session.execute(select(KnowledgeSource).where(KnowledgeSource.state == "enabled"))).scalars().all()
        )
        source = next(
            (s for s in sources if host in str(s.config.get("url", "")).lower()), None
        )
        if source is None:
            logger.warning("webhook_no_source", url=url)
            return {"status": "no_source"}

        if event == "deleted":
            from domain.models import Document

            doc = (
                await session.execute(
                    select(Document).where(
                        Document.tenant_id == source.tenant_id,
                        Document.source_id == source.id,
                        Document.canonical_url == url,
                    )
                )
            ).scalar_one_or_none()
            if doc is not None:
                doc.status = "deleted"
            return {"status": "deleted"}

        result = await _crawl_page(url, str(source.id), str(source.tenant_id))
        return result


@celery_app.task(name="workers.tasks_ingest.webhook_refresh", bind=True)
def webhook_refresh(self, url: str, event: str, tenant_id: str) -> dict:
    return run_async(lambda: _webhook_refresh(url, event, tenant_id))
