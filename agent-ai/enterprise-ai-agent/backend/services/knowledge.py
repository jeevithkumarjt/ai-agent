"""Knowledge store — extraction + ingestion into the DB-backed RAG store.

This is NOT an in-memory index anymore. The old in-process BM25 index never
survived restarts or horizontal scaling (each backend instance had its own copy,
and a restart wiped it until the next refresh cycle). Now the store plays one
job: extract plain text from `documents/` + crawled site pages, chunk it, embed
it, and upsert those chunks into `document_chunks` — the single source of truth
for retrieval. Hybrid search (Postgres tsvector ts_rank + pgvector cosine) then
runs in one query against that table via `RagService.search`.

Refresh is idempotent and best-effort: extraction/embedding/DB failures record
`last_error` and never crash the app. Chunks are deleted-then-inserted per
source_id so edits and removals are picked up on the next refresh cycle.
"""
from __future__ import annotations

import asyncio
import csv
import html
import json
import re
import threading
import time
import urllib.request
import uuid
from collections.abc import Iterable
from html.parser import HTMLParser
from pathlib import Path
from typing import Any

from core.embeddings import Embedder, get_embedder
from core.logging import get_logger
from core.settings import settings
from db.models import DocumentChunk, Tenant
from db.session import async_session_factory
from sqlalchemy import delete, select

from services.rag import chunk_text

logger = get_logger("services.knowledge")

USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) TryviumKnowledgeBot/1.0"

_HTML_SKIP_TAGS = {"script", "style", "noscript", "header", "nav", "footer", "aside"}


class _TextExtractor(HTMLParser):
    """Collects visible text from HTML; drops script/style/noscript content."""

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self._parts: list[str] = []
        self._skip = 0

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag in _HTML_SKIP_TAGS:
            self._skip += 1

    def handle_endtag(self, tag: str) -> None:
        if tag in _HTML_SKIP_TAGS and self._skip:
            self._skip -= 1

    def handle_data(self, data: str) -> None:
        if not self._skip:
            self._parts.append(data)

    def text(self) -> str:
        return " ".join(piece.strip() for piece in self._parts if piece.strip())


def _flatten_json(obj: Any, prefix: str = "") -> Iterable[str]:
    if isinstance(obj, dict):
        for key, value in obj.items():
            label = f"{prefix}{key}: " if prefix else f"{key}: "
            yield from _flatten_json(value, label)
    elif isinstance(obj, list):
        for item in obj:
            yield from _flatten_json(item, prefix)
    else:
        yield f"{prefix}{obj}"


def _extract_text(path: Path) -> str | None:
    """Return plain text for a supported file, or None when unsupported/unreadable."""
    suffix = path.suffix.lower()
    try:
        if suffix in {".txt", ".md", ".markdown", ".rst", ".text", ".log"}:
            return path.read_text(encoding="utf-8", errors="replace")
        if suffix == ".csv":
            rows: list[str] = []
            with path.open(encoding="utf-8", errors="replace", newline="") as fh:
                for row in csv.reader(fh):
                    rows.append(" | ".join(cell.strip() for cell in row))
            return "\n".join(rows)
        if suffix == ".json":
            body = json.loads(path.read_text(encoding="utf-8", errors="replace"))
            return "\n".join(_flatten_json(body))
        if suffix in {".html", ".htm", ".xml"}:
            parser = _TextExtractor()
            parser.feed(path.read_text(encoding="utf-8", errors="replace"))
            return parser.text()
        if suffix == ".pdf":
            try:
                from pypdf import PdfReader  # type: ignore[import-not-found]
            except ImportError:
                logger.warning("knowledge_skip_pdf", reason="pypdf not installed", file=str(path))
                return None
            reader = PdfReader(str(path))
            return "\n".join((page.extract_text() or "") for page in reader.pages)
        if suffix == ".docx":
            try:
                from docx import Document  # type: ignore[import-not-found]
            except ImportError:
                logger.warning("knowledge_skip_docx", reason="python-docx not installed", file=str(path))
                return None
            return "\n".join(paragraph.text for paragraph in Document(str(path)).paragraphs)
        if suffix == ".xlsx":
            try:
                from openpyxl import load_workbook  # type: ignore[import-not-found]
            except ImportError:
                logger.warning("knowledge_skip_xlsx", reason="openpyxl not installed", file=str(path))
                return None
            wb = load_workbook(str(path), read_only=True, data_only=True)
            lines: list[str] = []
            for ws in wb.worksheets:
                for row in ws.iter_rows(values_only=True):
                    lines.append(" | ".join("" if cell is None else str(cell) for cell in row))
            wb.close()
            return "\n".join(lines)
        if suffix == ".pptx":
            try:
                from pptx import Presentation  # type: ignore[import-not-found]
            except ImportError:
                logger.warning("knowledge_skip_pptx", reason="python-pptx not installed", file=str(path))
                return None
            prs = Presentation(str(path))
            return "\n".join(
                shape.text for slide in prs.slides for shape in slide.shapes if hasattr(shape, "text")
            )
    except Exception as exc:  # a corrupt file must never kill a refresh
        logger.warning("knowledge_extract_failed", file=str(path), error=str(exc))
        return None
    return None


def _http_get(url: str) -> str | None:
    request = urllib.request.Request(
        url, headers={"User-Agent": USER_AGENT, "Accept": "text/html,application/xhtml+xml"}
    )
    try:
        with urllib.request.urlopen(request, timeout=20) as resp:
            raw = resp.read(2 * 1024 * 1024)
    except Exception as exc:
        logger.warning("knowledge_fetch_failed", url=url, error=str(exc))
        return None
    return raw.decode("utf-8", errors="replace")


def _sitemap_urls(body: str) -> list[str]:
    return re.findall(r"<loc>\s*([^<]+?)\s*</loc>", body, flags=re.IGNORECASE)


def _page_title(body: str, fallback: str) -> str:
    match = re.search(r"<title[^>]*>(.*?)</title>", body, flags=re.IGNORECASE | re.DOTALL)
    return html.unescape(match.group(1)).strip() if match else fallback


class KnowledgeStore:
    """Extracts `documents/` + site pages and upserts their chunks into `document_chunks`.

    Persistent state is only the last-refresh stats; all chunk data lives in
    Postgres so every backend instance sees the same index and no restart can
    lose it. Retrieval is handled by `RagService.search` (hybrid ts_rank + cosine).
    """

    def __init__(
        self,
        *,
        docs_dir: Path | None = None,
        sites: list[str] | None = None,
        embedder: Embedder | None = None,
    ) -> None:
        self.docs_dir = Path(settings.knowledge_docs_dir) if docs_dir is None else docs_dir
        self.sites = list(settings.knowledge_sites) if sites is None else sites
        self.embedder = embedder if embedder is not None else get_embedder()
        self._lock = threading.Lock()
        self._sources: list[str] = []
        self._stats: dict[str, Any] = {
            "last_refresh": None,
            "last_error": None,
            "duration_ms": None,
            "chunks": 0,
        }

    # -- refresh ---------------------------------------------------------------

    async def refresh(self) -> None:
        """Extract, embed, and upsert all chunks into `document_chunks`.

        Best-effort by design: failures are recorded in `last_error` and the
        app keeps serving (the previous DB contents remain searchable).
        """
        started = time.monotonic()
        try:
            chunks = await asyncio.to_thread(self._collect)
            persisted = await self._persist(chunks)
            with self._lock:
                self._sources = sorted({item["source"] for item in chunks})
            self._stats.update(
                last_refresh=time.time(),
                last_error=None,
                duration_ms=int((time.monotonic() - started) * 1000),
                chunks=persisted,
            )
            logger.info(
                "knowledge_refreshed",
                sources=len(self._sources),
                chunks=persisted,
                duration_ms=self._stats["duration_ms"],
            )
        except Exception as exc:
            logger.exception("knowledge_refresh_failed")
            self._stats["last_error"] = str(exc)

    def _collect(self) -> list[dict[str, Any]]:
        """Extract + chunk documents/ files and crawled site pages (sync I/O)."""
        chunks: list[dict[str, Any]] = []
        if not self.docs_dir.is_dir():
            logger.warning("knowledge_docs_missing", path=str(self.docs_dir))
        else:
            for path in sorted(self.docs_dir.rglob("*")):
                if not path.is_file():
                    continue
                text = _extract_text(path)
                if not text:
                    continue
                rel = str(path.relative_to(self.docs_dir)).replace("\\", "/")
                source = f"documents/{rel}"
                for piece in chunk_text(text):
                    chunks.append({"source": source, "title": rel, "kind": "document", "text": piece})
        for url in self._discover_urls():
            body = _http_get(url)
            if not body:
                continue
            text = _extract_html_text(body)
            if not text or len(text) < 200:
                continue
            title = _page_title(body, url)
            for piece in chunk_text(text):
                chunks.append({"source": url, "title": title, "kind": "web", "text": piece})
        return chunks

    async def _persist(self, chunks: list[dict[str, Any]]) -> int:
        """Embed and upsert chunks into `document_chunks` for the default tenant.

        Each source_id is delete-then-inserted inside one transaction so edited
        or removed sources are reflected immediately and no stale rows survive.
        """
        if not chunks:
            return 0
        if not self.embedder.real:
            logger.info(
                "knowledge_persist_skip",
                reason="embedder is not real; vector ingestion skipped (lexical search still works)",
            )
            return 0

        tenant_id = await self._default_tenant_id()
        if tenant_id is None:
            logger.warning("knowledge_persist_skip", reason="no tenant seeded — run `python -m backend.cli seed`")
            return 0

        texts = [item["text"] for item in chunks]
        embeddings = await self.embedder.embed(texts)
        by_source: dict[str, list[tuple[dict[str, Any], list[float]]]] = {}
        for item, emb in zip(chunks, embeddings, strict=True):
            by_source.setdefault(item["source"], []).append((item, emb))

        async with async_session_factory() as session:
            for source, rows in by_source.items():
                await session.execute(
                    delete(DocumentChunk).where(
                        DocumentChunk.tenant_id == tenant_id, DocumentChunk.source_id == source
                    )
                )
                session.add_all(
                    DocumentChunk(
                        tenant_id=tenant_id,
                        source_id=source,
                        chunk_text=item["text"],
                        embedding=emb,
                        chunk_metadata={"source_id": source, "title": item["title"], "kind": item["kind"]},
                    )
                    for item, emb in rows
                )
            await session.commit()
        return len(chunks)

    async def _default_tenant_id(self) -> uuid.UUID | None:
        async with async_session_factory() as session:
            return await session.scalar(select(Tenant.id).limit(1))

    # -- site crawl ------------------------------------------------------------

    def _discover_urls(self) -> list[str]:
        seen: set[str] = set()
        for site in self.sites:
            base = site.rstrip("/")
            for hint in ("sitemap_index.xml", "sitemap.xml"):
                body = _http_get(f"{base}/{hint}")
                if not body:
                    continue
                locs = _sitemap_urls(body)
                pages = [loc for loc in locs if "sitemap" not in loc]
                for sub in [loc for loc in locs if "sitemap" in loc]:
                    sub_body = _http_get(sub)
                    if sub_body:
                        pages.extend(_sitemap_urls(sub_body))
                for page in pages:
                    if page.startswith(("http://", "https://")) and self._same_origin(base, page):
                        seen.add(page)
                if seen:
                    return sorted(seen)[: settings.knowledge_max_site_pages]
        for site in self.sites:
            seen.add(site.rstrip("/"))
        return sorted(seen)

    @staticmethod
    def _same_origin(base: str, page: str) -> bool:
        host = base.split("//")[-1].split("/")[0]
        return host in page

    # -- status ----------------------------------------------------------------

    def status(self) -> dict[str, Any]:
        with self._lock:
            sources = list(self._sources)
            stats = dict(self._stats)
        return {
            "docs_dir": str(self.docs_dir),
            "sites": list(self.sites),
            "sources": sources,
            "source_count": len(sources),
            "chunk_count": stats.get("chunks", 0),
            "last_refresh": stats.get("last_refresh"),
            "last_error": stats.get("last_error"),
            "duration_ms": stats.get("duration_ms"),
        }


def _extract_html_text(body: str) -> str:
    parser = _TextExtractor()
    parser.feed(body)
    return parser.text()
