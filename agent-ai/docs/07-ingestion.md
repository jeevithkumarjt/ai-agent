# 07 — Ingestion Pipeline

## 7.1 Crawler

Distributed, async (httpx), incremental:

- **Sitemap discovery**: fetch `sitemap_index.xml`, recurse into nested `<sitemap>` entries, collect
  all `<url>` (including `<loc>`). Handle `text/sitemap`, gz, and RSS-based sitemaps.
- **robots.txt** compliance: cache parsed rules, respect `Disallow`, `Allow`, `Crawl-delay`.
- **Canonical URLs**: honor `<link rel=canonical>`, redirects (302→final), trailing-slash, query
  parameter stripping policy; dedupe by canonical URL.
- **Change detection**: `ETag`/`Last-Modified` (revalidation), full-body SHA-256 on fetch.
- **Duplicate detection**: global content hash → if hash exists under another canonical URL, mark as
  duplicate and alias.
- **Retry**: exponential backoff with jitter; 4 attempts; `Retry-After` respected; circuit breaker
  per-host after repeated 5xx/429.
- **Incremental**: previously seen URLs revalidated; new URLs added; vanished URLs → mark
  `deleted` (soft delete + vector removal after grace period).
- **Concurrency**: worker-pool fan-out via Celery (config `CRAWLER_CONCURRENCY`), shared rate-limit
  per host in Redis.

## 7.2 Parsers (per content-type)

| Type | Parser | Notes |
|------|--------|-------|
| HTML | trafilatura → clean main-content markdown | boilerplate removal, metadata extraction, canonical links, JSON-LD |
| Markdown | md→structured | heading-aware |
| PDF | pypdf + layout heuristics | page markers, tables extracted to markdown |
| DOCX | python-docx | paragraphs, tables, headings |
| CSV | csv stdlib | header row → row-wise chunks with header context |
| TXT | stdlib | line-aware |
| Image | OCR (tesseract / cloud vision provider) | `OCR_ENABLED`; results parsed as text docs |
| Video | transcription (whisper) optional | captions → timed chunks |

All parsers return a normalized `ParsedDocument`: `{title, lang, sections: [{heading_path, heading, text}], metadata, links[], images[]}`.

## 7.3 Chunking

- Default **heading-based**: preserve section hierarchy; then size windows `[CHUNK_MIN_CHARS,
  CHUNK_MAX_CHARS]` with `CHUNK_OVERLAP_CHARS` overlap. Each chunk carries `section_path`
  (e.g. `/products/ai-assistant/features`) enabling heading-level citations.
- Sentence-boundary aware; never splits code blocks/tables mid-structure when detectable.

## 7.4 Change-driven re-indexing

`document.sha256` full-content hash gates the pipeline:

```
fetch → hash unchanged? → skip (mark crawl ok)
      → hash changed?  → parse → chunk (new sha256 per chunk)
          → chunk sha256 same as stored (for that doc version)? → keep old embedding
          → changed/new chunk → embed → upsert Qdrant (payload carries new doc_version)
          → remove embeddings for deleted chunks → doc.version += 1 →
            bump source.version → invalidate cache namespace → eval regression
```

Only changed chunks are re-embedded — a one-paragraph change touches one or two vectors.

## 7.5 Versioning & cleanup

- `documents.version` increments per content change; `chunks` reference `doc_version`.
- Qdrant points keep a `doc_version` payload; a periodic `index-cleanup` task deletes points whose
  version is older than the current document version (snapshot-consistent GC).
- Deleted pages: soft-delete in Postgres → after 24h grace, delete vectors + hard-delete row.

## 7.6 Failure handling

| Failure | Handling |
|---------|----------|
| Transient fetch (5xx/timeout) | Retry w/ exponential backoff → DLQ → alert |
| Parser error on one doc | Isolate; mark `failed`; continue; alert; retry via `reparse` |
| Embedding provider down | Retry; queue stays; dead-letter with resume |
| Partial crawl | Mark `partial`; resume from checkpoints; never re-crawl whole site |
| Corrupt document | Quarantine; no vectors written; alert with URL |

## 7.7 Schedules & triggers

- Daily incremental cron per source (`schedule.cron`) → `ingest_flow`.
- Instant webhook `/webhooks/content` → priority queue → single-URL crawl + cascade.
- Manual trigger, admin reindex, deploy-time full ingest.
