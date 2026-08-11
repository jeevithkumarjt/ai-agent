# 17 — Architecture Decision Records

## ADR-001 FastAPI over NestJS

- **Problem**: pick the backend that will outlive years of AI/ML iteration.
- **Options**: FastAPI (Python), NestJS (TS), others.
- **Decision**: **FastAPI**.
- **Trade-offs**: Python GIL (mitigated: async I/O everywhere, embeddings run in worker processes,
  CPU-bound model scoring offloaded to ONNX/vectorized ops); loses TS end-to-end typing (mitigated:
  OpenAPI codegen to typed TS client).
- **Consequences**: single language for API + workers + eval; access to torch/transformers/ONNX;
  streaming/SSE first-class; fast dev loop.

## ADR-002 Qdrant over alternatives

- **Problem**: vector store that balances filter performance, scale, and ops simplicity for years.
- **Options**: Qdrant, Weaviate, Pinecone, Milvus, pgvector, Chroma.
- **Decision**: **Qdrant**.
- **Trade-offs**: another stateful service to run (mitigated: single binary, snapshots, k8s operator
  or managed cloud); vs pgvector's "one DB" simplicity — Qdrant's filtered search, sparse vectors,
  quantization, and upsert ergonomics win at enterprise scale.
- **Consequences**: vector + sparse in one store; payload filtering enables tenant/source_version
  isolation; index cleanup via `delete_by_filter`.

## ADR-003 PostgreSQL + Redis over MongoDB / MySQL

- **Decision**: Postgres for truth (ACID, JSONB, FTS, partitions, logical replication), Redis for
  hot paths (cache, queues, memory, rate limits). Mongo not needed — no document-native workloads
  that JSONB can't serve, and we gain relational integrity for versions/conversations/audit.

## ADR-004 Redis-backed Celery over Kafka-first

- **Decision**: Celery + Redis transport now; broker abstraction so Kafka/RabbitMQ can be swapped if
  throughput demands. Redis is already required for caching; zero extra stateful service.
- **Trade-offs**: Redis Streams durability < Kafka; mitigated by `acks_late`, DLQ, idempotent tasks,
  and 24h result retention.

## ADR-005 Local-first embeddings (fastembed BGE-M3) over hosted-only

- **Decision**: default to on-device/ONNX `BAAI/bge-m3` via `fastembed`; provider abstraction allows
  OpenAI/Cohere/Vertex swap via config.
- **Trade-offs**: compute on our nodes (cheap CPU batch) vs per-token SaaS cost and data egress;
  upgradeable by config. Embedding *lineage* recorded (model+version per vector).

## ADR-006 Provider-gateway for LLMs (never hardcode)

- **Decision**: `LLMGateway` with provider registry (OpenAI/Anthropic/Gemini/Azure/Mistral/Groq/
  Ollama/local), task-based routing (fast/default/reasoning), retries, fallbacks, budget/cost caps.
- **Consequences**: new model = config + optional thin adapter; cost optimizer routes by intent.

## ADR-007 Versioned, hash-gated incremental ingestion

- **Decision**: content is versioned (per-document) and gated by SHA-256; only changed chunks are
  re-embedded; cache namespaces versioned by source. This is the anti-"re-index everything"
  contract and the core freshness guarantee.

## ADR-008 Structured refusal over hallucination

- **Decision**: if confidence < threshold or validator fails → refuse with explanation + related
  sources. Product requirement overrides raw answer-completion rate.

## ADR-009 Evaluation gate as deploy blocker

- **Decision**: golden dataset runs in CI and post-ingest; regressions block promotion. Mirrors
  model-release eval discipline and prevents silent quality decay.

## ADR-010 Multi-agent is a workflow, not a fleet

- **Decision**: implement agents as composable pipeline stages (planner/retriever/reranker/verifier/
  citation/validator/monitor/self-heal) inside services + workers — orchestrated deterministically —
  rather than independent LLM agents. Deterministic stages are testable, cheap, and observable.
  MCP-style external agents plug in at the tool layer when genuinely needed.

## ADR-011 Storage abstraction for objects

- **Decision**: `StorageBackend` protocol with local/S3/Azure/GCS adapters. Documents/artifacts never
  touch the API process filesystem directly.
