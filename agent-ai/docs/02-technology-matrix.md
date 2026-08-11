# 02 — Technology Decision Matrix

Every selection is made for long-lived enterprise operation. "Winner" means the choice we build
around; others remain viable behind abstraction boundaries.

## 2.1 Backend framework

| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| **FastAPI (Python)** | Async, OpenAPI out of box, streaming/SSE, richest AI/ML ecosystem (torch, sentence-transformers, ONNX), single language for API+workers+eval | GIL (mitigated via async/processes), typing discipline required | **Winner** — AI-first teams converge here |
| NestJS (Node) | Strong DI/DDD ergonomics, mature | Thin AI ecosystem; embeddings/rerankers are Python-first | Runner-up |

## 2.2 Vector database

| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| **Qdrant** | Filtered search at scale, payload + keyword index, quantization (scalar/binary), single static binary, easy HA, gRPC, built-in sparse vectors | Requires ops (small) | **Winner** — operational simplicity + performance + filtering |
| Weaviate | GraphQL, modules | Heavier, module coupling | — |
| Pinecone | Managed | Cost at scale, lock-in | SaaS alternative |
| Milvus | Massive scale | Complex distributed ops | — |
| pgvector | Same DB as metadata | Filter+search perf, no built-in sparse, migration/upsert ergonomics | Fallback for small deploys |
| Chroma | Simple | Not production-grade for HA | Dev only |

## 2.3 Relational database

**PostgreSQL 16** — chosen over MySQL/Mongo:
- JSONB for flexible source/connector config, GIN indexing.
- Declarative partitioning for `messages` and `events`.
- Full-text search as a keyword baseline + `tsvector` support.
- MVCC for zero-downtime migrations, logical replication for HA/DR.
- ACID invariants for versioned documents/chunks.

## 2.4 Cache / queue / memory

**Redis 7** single cluster for three workloads:
- **Cache**: retrieval/query/response/embedding caches, multi-level invalidation by namespace.
- **Queue**: Celery broker using Redis transport (Redis Streams semantics under the hood).
- **Memory**: session + conversation memory (short TTL), rate-limit counters, locks.
Kafka/RabbitMQ remain interchangeable behind a broker abstraction if throughput exceeds ~100k msg/s.

## 2.5 Embedding model

| Model | Multilingual | Dim | Notes | Verdict |
|-------|--------------|-----|-------|---------|
| **BAAI/bge-m3** | 100+ langs | 1024 | Dense + sparse (lexical) in one model, excellent MTEB retrieval | **Winner (default)** |
| OpenAI text-embedding-3-large | 100+ langs | 3072 | Hosted, cost per token | Config option |
| Cohere embed-v3 | 100+ langs | 1024 | Good for RAG, hosted | Config option |
| Nomic embed-text-v1.5 | en+ | 768 | Good small hosted | Config option |
| intfloat/multilingual-e5-large | 100+ | 1024 | Strong, dense-only | Config option |

**Decision**: default `fastembed` running `BAAI/bge-m3` locally (zero marginal cost, offline,
upgradeable by changing model + dimension config with re-embed). Provider abstraction means moving
to any hosted provider requires **zero code changes**.

## 2.6 LLM gateway

No single model is "the" model. `ModelGateway` routes by task/intent/cost:

| Provider | Default model | Role |
|----------|---------------|------|
| OpenAI | `gpt-4o-mini` | Default synthesis |
| Anthropic | `claude-sonnet-4-5` | Complex/high-quality answers |
| Google Gemini | `gemini-2.5-flash` | Multimodal, fast |
| Azure OpenAI | `gpt-4o-mini` deployment | Enterprise compliance |
| Mistral | `mistral-large-latest` | EU data residency |
| Groq | `llama-3.3-70b-versatile` | Cheap low-latency |
| Ollama / local | `llama3.1` | Air-gapped / zero cost |
| o-series / reasoning | `o3-mini` | Hard reasoning via `LLM_REASONING_MODEL` |

All behind one async interface: `complete()`, `stream()`, `embed()` not required. Switching
providers = config change; no code change.

## 2.7 Reranker

- Default: `BAAI/bge-reranker-v2-m3` via fastembed/onnx locally.
- Optional hosted: Cohere Rerank behind the same `RerankerGateway` interface.

## 2.8 Frontend

**Next.js 15 (App Router) + React 19 + TypeScript strict + Tailwind v4 + shadcn/ui + Motion**.
Server Components for page shells, streaming `useChat`-style SSE consumption, Edge where useful.
WCAG AA, dark mode, responsive, SEO via metadata API + sitemap/robots.

## 2.9 Object storage

`StorageBackend` abstraction: **local** (dev), **S3/MinIO**, **Azure Blob**, **GCS**.
Stores raw downloads, PDFs, images for OCR, exports, artifacts.

## 2.10 Observability

| Concern | Tool |
|---------|------|
| Traces | OpenTelemetry SDK → OTLP → Jaeger / Tempo |
| Metrics | Prometheus (custom RAG/embedding/token/cache/retrieval metrics) |
| Logs | Structured JSON (structlog) → Loki |
| Errors | Sentry |
| Dashboards | Grafana |

## 2.11 Deployment

| Layer | Tool |
|-------|------|
| Images | Docker + Dockerfile multi-stage |
| Dev orchestration | Docker Compose |
| Prod orchestration | Kubernetes + Helm chart |
| IaC | Terraform (EKS/AKS/GKE) |
| CI/CD | GitHub Actions, blue/green + canary via Argo Rollouts or native manifests |
| Autoscaling | KEDA (Redis Streams triggers for Celery) + HPA |

## 2.12 Cost-control enablers

- **AI Cost Optimizer**: intent classifier routes simple→fast model, complex→large, hard→reasoning.
- Embeddings computed locally (fastembed) by default — zero per-token embedding cost.
- Cache-first architecture; response cache hits bypass LLM entirely.
- Eval gates catch regressions before they ship.
