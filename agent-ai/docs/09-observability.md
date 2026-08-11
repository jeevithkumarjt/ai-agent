# 09 — Observability

## 9.1 Stack

- **Traces**: OpenTelemetry SDK (Python `opentelemetry` + `asgi` instrumentation) → OTLP →
  OTel Collector → Jaeger (or Tempo).
- **Metrics**: Prometheus. Custom collectors registered via `prometheus-fastapi-instrumentator` +
  manual `Counter`/`Histogram` for AI-domain metrics.
- **Logs**: structured JSON via `structlog`; all correlation fields `{trace_id, tenant_id,
  request_id, service}`; shipped to Loki via Promtail or OTLP logs.
- **Errors**: Sentry (DSN config), sampling configurable.
- **Dashboards**: Grafana provisioned dashboards (API, RAG, ingestion, infra).

## 9.2 AI-domain metrics (all namespaced `agentai_*`)

| Metric | Type | Description |
|--------|------|-------------|
| `agentai_ingest_pages_total{source,status}` | Counter | crawl results |
| `agentai_ingest_duration_seconds` | Histogram | per-page crawl+parse+embed |
| `agentai_ingest_chunks_embedded_total` | Counter | embeddings written |
| `agentai_ingest_cache_invalidations_total` | Counter | version bumps |
| `agentai_retrieval_latency_seconds` | Histogram | full retrieval path |
| `agentai_retrieval_hits{stage}` | Counter | per query/rerank/cache stage |
| `agentai_retrieval_cache_hit_ratio` | Gauge | — |
| `agentai_rerank_scores` | Histogram | rerank score distribution |
| `agentai_answer_latency_seconds` | Histogram | end-to-end answer |
| `agentai_tokens_total{provider,model}` | Counter | token usage |
| `agentai_answer_grounded` | Counter | grounded vs refused |
| `agentai_confidence` | Histogram | confidence distribution |
| `agentai_hallucination_flags_total` | Counter | verifier rejections |
| `agentai_llm_errors_total{provider}` | Counter | — |
| `agentai_queue_depth{queue}` | Gauge | Celery queue depth |
| `agentai_dlq_depth` | Gauge | dead-letter depth |
| `agentai_eval_score` | Gauge | last eval run score |

## 9.3 Distributed tracing spans

- `ingest.flow`, `ingest.discover`, `ingest.fetch`, `ingest.parse`, `ingest.chunk`,
  `ingest.embed`, `ingest.index`, `ingest.cache_invalidate`, `ingest.eval`
- `query.route`, `query.rewrite`, `query.multi`, `query.retrieve.dense`, `query.retrieve.sparse`,
  `query.fuse`, `query.rerank`, `query.compress`, `query.ground`, `query.synthesize`,
  `query.validate`, `query.cache.{get,set}`

## 9.4 Alerting rules (Prometheus/Alertmanager)

- `agentai_queue_depth > 1000` for 5m → page workers/autoscale.
- `agentai_dlq_depth > 0` → on-call.
- `agentai_llm_errors_total` rate > 5% for 10m → gateway alert.
- `agentai_eval_score < threshold` → content regression alert.
- `ingest_pages_total{failed}` rate spike → crawler alert.
- API error rate > 2%, P95 latency > 2.5s → service SLO alert.

## 9.5 Dashboards

- **API & RAG**: latency, throughput, cache hit ratio, confidence, grounding, tokens.
- **Ingestion**: crawl throughput, changed vs unchanged, embed rate, queue depth, DLQ.
- **Infra**: CPU/mem, connections, disk, PG/Redis/Qdrant health.

## 9.6 Log correlation

One `RequestContext` per request propagated into logs/metrics/spans:
`{trace_id, tenant_id, user_id, session_id, source_id, document_id, chunk_id, model}`.
