# 01 — System Architecture

## 1. Executive summary

AgentAI is a self-learning enterprise AI knowledge platform. It continuously crawls configured
sources (starting with https://www.tryvium.ai), parses and chunks content, generates embeddings,
and serves grounded, cited answers through a hybrid retrieval RAG pipeline.

Hard non-negotiables:

1. **Never hallucinate** — every answer must be synthesized strictly from retrieved chunks; the
   verifier rejects ungrounded statements; low confidence returns "I couldn't find a reliable
   answer".
2. **Never serve stale data** — incremental crawl + content hashing + versioned chunks + automatic
   re-embedding of affected chunks only + cache invalidation on content events.
3. **Fast** — cached < 800 ms P95, uncached < 2 s P95; ingestion of 1000+ pages in < 5 minutes.

## 2. C4 context diagram

```
                     ┌────────────────────────────────────────┐
                     │         End Users (browser)            │
                     │  Chat / Search / Admin dashboard        │
                     └───────────────────┬────────────────────┘
                                         │ HTTPS (REST / SSE / WS)
                                         ▼
                     ┌────────────────────────────────────────┐
                     │              [AgentAI]                 │
                     │   Web (Next.js) │  API (FastAPI)       │
                     │   ─────────────┼───────────────────    │
                     │   Crawler · Parsers · Embeddings       │
                     │   Hybrid retrieval · Reranking         │
                     │   LLM Gateway · Memory · Eval          │
                     └──┬──────┬───────┬────────┬────────┬────┘
                        │      │       │        │        │
              ┌─────────┘  ┌───┴───┐ ┌─┴─────┐ ┌─┴──────┐ ┌┴─────────┐
              │ Postgres   │ Redis │ │Qdrant │ │ Object │ │ LLM/Emb  │
              │ metadata   │ cache │ │vectors│ │storage │ │ providers│
              └────────────┴───────┘ └───────┘ └────────┘ └──────────┘

   External: https://www.tryvium.ai · sitemap_index.xml · future connectors
             (SharePoint, Confluence, Notion, Drive, CRM, APIs, DBs)
```

## 3. Container diagram

| Container | Runtime | Responsibility |
|-----------|---------|----------------|
| `web` | Next.js 15 (Node) | Server components, streaming chat UI, admin dashboard |
| `api` | FastAPI (uvicorn, async) | REST/SSE endpoints, orchestration, retrieval, gateway |
| `worker-default` | Celery | Long-running ingestion tasks (crawl, parse, embed) |
| `worker-priority` | Celery | Fast jobs: webhook refresh, eval, cache invalidation |
| `worker-index` | Celery | Vector index maintenance + cleanup |
| `crawler` | Celery + httpx | Distributed concurrent fetches |
| `postgres` | Postgres 16 | Relational source of truth |
| `redis` | Redis 7 | Cache, queues, rate limits, memory |
| `qdrant` | Qdrant | Vector + payload index |
| `otel-collector` | OTel Collector | Traces/metrics pipeline |
| `prometheus` / `grafana` / `loki` | — | Observability stack |
| `minio` | S3-compatible | Local object storage (dev) |

## 4. Event-driven flows

All pipelines are event-driven. Events flow through Redis Streams (Celery queues); nothing blocks
anything else.

### 4.1 Full ingestion (new source)

```
Source created → SourceCreated(event) → queue:ingest →
  discover_sitemap → enqueue URLs → worker:crawl (concurrent, ETag/LM/hash) →
    page changed? → parse → chunk → hash each chunk →
      changed chunks only → embed (batch) → upsert Qdrant (versioned) →
        update document/chunk metadata → invalidate retrieval cache →
          run golden-dataset regression eval → alert on regression
```

### 4.2 Webhook refresh (content published on the site)

```
CMS webhook → POST /api/v1/webhooks/content (signed) →
  resolve affected URL(s) → queue:priority → crawl single page →
    diff by SHA-256 → reparse/rechunk → re-embed changed chunks → cache purge
```

### 4.3 Question → grounded answer

```
Question → AuthZ + rate limit → memory hydration (session/user) →
  intent classifier (fast model) → query rewrite (planner) →
    multi-query expansion → hybrid retrieval:
      BM25 (sparse) ∥ dense embeddings ∥ knowledge-graph-adjacent chunks
    → RRF fusion → metadata filters → cross-encoder rerank →
      context compression (relevant sentence extraction) →
        verifier/grounding check against compressed context →
          LLM synthesis (grounded prompt, forced citations) →
            output validator (cites present? every claim in context?)
              → citation builder (source page URLs, headings)
                → SSE stream to client + cache response
```

## 5. Quality gates

| Gate | Where | Behaviour |
|------|-------|-----------|
| Confidence score | after rerank | if < threshold → "I couldn't find a reliable answer" |
| Grounding verifier | before/after LLM | claim-level containment in context; else drop/flag |
| Answer validator | after LLM | requires ≥1 citation, no unsupported claims |
| Eval regression | after every KB update | golden dataset; fail → rollback index snapshot + alert |
| Dead-letter queue | all workers | poisoned jobs quarantined + alerted |

## 6. Consistency model

- Postgres is the source of truth for **what exists** (sources, documents, chunks, versions).
- Qdrant is derived: every vector payload carries `chunk_id`, `doc_version`, `source_version`.
- Reads publish to a single `source_version` snapshot per workspace; if Qdrant lags, we read
  metadata from Postgres and only fetch embeddings that match the current version (filtered query).
- Cache keys are namespaced by `{workspace}:{source_version}` so any content event invalidates the
  entire affected namespace atomically.

## 7. Architecture decision summary (see 17-adr.md for full ADRs)

| Decision | Choice | Reason |
|----------|--------|--------|
| Backend | FastAPI (Python) | Best AI ecosystem, async, streaming, typed |
| Vector DB | Qdrant | Filters + speed + single binary + quantization |
| Relational | Postgres 16 | Metadata, ACID, JSONB, partitioning, full-text fallback |
| Cache/queue/memory | Redis 7 | Multi-purpose, low latency, streams for durable queues |
| Frontend | Next.js 15 | SSR/edge, streaming, DX |
| Crawler | httpx + asyncio, Celery fan-out | Async concurrency, control, resilience |
| LLM | Provider gateway | Config-driven multi-provider, no hardcoding |
| Embeddings | fastembed (BGE-M3) default, provider-abstraction | Local inference, multilingual, upgradeable |
| Observability | OTel + Prometheus + Loki + Sentry | End-to-end traces, metrics, logs, errors |
