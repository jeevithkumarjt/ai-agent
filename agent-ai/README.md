# AgentAI — Enterprise AI Knowledge Platform

Production-grade, self-learning AI knowledge assistant that ingests `https://www.tryvium.ai`
(and any pluggable source), keeps itself continuously updated, and answers questions with
grounded, cited, enterprise-grade accuracy.

## Principles

- **Grounded answers only.** Every response is built from retrieved chunks and must cite source
  pages. Confidence below threshold returns *"I couldn't find a reliable answer"* instead of guessing.
- **No stale data.** Incremental crawling, SHA-256 content hashing, ETag/Last-Modified, webhook
  invalidation, automatic re-embedding of only affected chunks, and cache invalidation.
- **No mismatches.** Versioned documents/chunks/embeddings; retrieval runs against a single
  consistent snapshot per workspace.
- **Fast.** Multi-layer cache (Redis retrieval cache, query cache, response cache, embedding cache,
  CDN). Cached < 800 ms, uncached < 2 s.
- **Extensible.** Every data source is a pluggable connector behind a common ingestion interface.
  Every LLM/embedding provider is a pluggable provider behind a gateway.
- **Observable.** OpenTelemetry traces, Prometheus metrics, structured logs, Sentry errors.
- **Automated.** Celery workers, Redis streams/queues, dead-letter queues, self-healing retries,
  automatic alerting, golden-dataset regression eval after every knowledge update.

## Monorepo layout

```
apps/api      FastAPI backend (REST, SSE, async workers) — hexagonal/DDD
apps/web      Next.js (App Router) frontend — chat UI + admin dashboard
docs/         Architecture, API spec, database design, runbooks, DR, scaling
infra/        Docker Compose, Helm chart, Terraform, Prometheus/Grafana/Loki
tests/        Golden dataset + end-to-end evaluation harness
.github/      CI/CD workflows
scripts/      Operational tooling
```

## Quick start (Docker)

```bash
cp .env.example .env          # fill in secrets / provider keys
docker compose -f infra/docker/docker-compose.yml up -d --build
```

- API: http://localhost:8000 (docs at `/docs`)
- Web: http://localhost:3000
- Qdrant: http://localhost:6333
- Grafana: http://localhost:3001 (admin/admin)
- Prometheus: http://localhost:9090

Then trigger the first full ingest (seeds the default `https://www.tryvium.ai` source):

```bash
bash scripts/bootstrap.sh
```

The default owner account `owner@tryvium.ai` / `ChangeMe123!` is created on first startup
(change it immediately in production). Sign in at http://localhost:3000.

## Documentation

Start with `docs/01-architecture.md`. See `docs/README.md` for the full index.

## License

Proprietary. © Sensiple / Tryvium.
