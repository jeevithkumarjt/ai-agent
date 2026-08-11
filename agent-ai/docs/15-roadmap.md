# 15 — Implementation Roadmap

## 15.1 Phases

| Phase | Duration | Outcome |
|-------|----------|---------|
| 0 — Foundations | wk 1–2 | Monorepo, CI skeleton, compose stack, domain models, migrations, health checks |
| 1 — Ingestion v1 | wk 3–5 | Website connector, sitemap discovery, crawler, parsers, chunking, hashing/versioning |
| 2 — Vector path | wk 6–7 | Embedding gateway, Qdrant index, chunk→vector pipeline, cleanup workers |
| 3 — Retrieval | wk 8–9 | Hybrid retrieval (dense+BM25+RRF), metadata filters, reranking, confidence |
| 4 — Answering | wk 10–12 | LLM gateway, grounded prompts, SSE streaming, validator, citations, refusal path |
| 5 — Frontend v1 | wk 11–14 | Chat UI, streaming, citations panel, conversation mgmt, feedback |
| 6 — Automation | wk 13–15 | Webhooks, cron schedules, cache invalidation, eval gate, DLQ/alerting |
| 7 — Admin | wk 15–17 | Admin dashboard: sources, jobs, prompts, models, keys, audit, eval |
| 8 — Hardening | wk 18–20 | Security passes, load test, chaos, DR drill, observability polish |
| 9 — SaaSization | wk 21–24 | Multi-tenancy hardening, billing/quotas, K8s autoscaling, canary |

## 15.2 Sprint plan (2-week sprints)

**S1**: repo skeleton, docker-compose, CI lint/unit, domain models, Alembic initial migration, health.
**S2**: settings/DI/config, repository layer, connectors interface, website connector config.
**S3**: sitemap discovery + robots + URL normalization; crawler engine (async, retry, backoff).
**S4**: parsers (html/md/pdf/docx/csv/txt); trafilatura integration; canonical/dup detection.
**S5**: chunking strategies; content hashing + versioning; change detection.
**S6**: embedding gateway (fastembed + provider abstraction); Qdrant client + collection lifecycle.
**S7**: embed/index workers; cache invalidation; vector cleanup; rebuild task.
**S8**: dense retrieval + BM25 sparse; RRF fusion; metadata filters; query API (internal).
**S9**: reranker gateway + cross-encoder; confidence scoring; context compression.
**S10**: LLM gateway (all providers); prompt management + versioning; grounded prompt builder.
**S11**: streaming SSE; answer validator; citation builder; refusal path; response cache.
**S12**: chat sessions/API; memory layers (session/conversation/user/workspace).
**S13**: web app shell (Next.js) — theme, layout, auth flow.
**S14**: chat UI streaming + markdown + code + tables + citations panel + copy.
**S15**: conversation history/pin/share/feedback; search history.
**S16**: webhooks + cron scheduler; priority queue; alerts.
**S17**: golden dataset + eval runner; regression gate wiring.
**S18**: admin dashboard (sources, jobs, prompts, models, keys, audit, metrics).
**S19**: security hardening (injection/PII scans, rate limits, RBAC polish, audit).
**S20**: load/stress/chaos; performance tuning; DR drill.
**S21**: Helm + Terraform prod; blue/green + canary; autoscaling.
**S22**: multi-tenant quotas/billing hooks; cost dashboards.
**S23**: knowledge-graph enrichment + graph-aware retrieval.
**S24**: MCP server + external tools; plugin connectors (sharepoint/confluence/notion/drive).
**S25**: AI governance & compliance export; final eval; GA.

## 15.3 Definition of Done (per sprint)

- Typecheck/lint/unit green; integration green where applicable.
- No TODO/mock/placeholder; docs updated; ADRs recorded.
- New endpoints covered by tests + OpenAPI diffed.
- Eval gate: no regression vs baseline.
