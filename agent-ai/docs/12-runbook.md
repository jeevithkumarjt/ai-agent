# 12 — Runbook

## 12.1 Daily checks (SRE)

1. `kubectl get pods` — all healthy; workers not crash-looping.
2. Grafana: queue depths, DLQ, eval score, API SLO.
3. Alerts: nothing firing for > 15 min.
4. Postgres: WAL archiving healthy (`pg_stat_archiver`), disk < 70%.
5. Qdrant: segment counts sane, no `sealed` stuck, disk < 70%.
6. Redis: memory < 80%, eviction policy `noeviction` on data DBs.

## 12.2 Common incidents

### API latency spikes
1. Check `agentai_llm_errors_total` and provider status page.
2. Check Redis (response-cache hit ratio dropped?).
3. Check Qdrant filter selectivity (payload cardinality).
4. Scale API via HPA; enable circuit breaker on offending provider.

### Queue backpressure / deep queue
1. Inspect `agentai_queue_depth{queue}`.
2. Check worker error rates; view DLQ.
3. If provider outage: pause schedule (Redis flag), let retries backoff, workers resume.

### DLQ non-empty
1. `GET /admin/jobs?queue=dlq` inspect payloads.
2. Re-drive via admin endpoint or CLI; after 3 re-drives still failing → alert + manual triage.

### Regressing eval score
1. Compare last two `eval_runs.details` per question (which questions regressed).
2. Check if a source update changed content (diff page history).
3. Option: pin previous `source_version` (rollback vector snapshot) — vectors are versioned precisely for this.

### Qdrant unhealthy
1. `/health/deps` shows Qdrant failure → API serves degraded mode: keyword-only via Postgres FTS
   (graceful degradation, answers still grounded, flagged `degraded=true`).
2. Restore from snapshot; re-embed from chunk store (idempotent).

### Redis restart / cache loss
1. Cold cache auto-rebuilds; request spikes expected; scale API during warm-up.
2. Queue loss mitigated by Celery `task_acks_late` + result store; re-enqueue idempotently.

## 12.3 Scheduled maintenance

| When | Task |
|------|------|
| Nightly | Backup verification, DB vacuum/analyze, log rotation, eval run |
| Weekly | Segment optimization (Qdrant), index rebuild check, cost report |
| Monthly | TLS cert renewal check, dependency bump review, DR restore drill |

## 12.4 Escalation paths

- On-call: API errors / DLQ / SLO breach.
- Infra: node drain, disk pressure, DB HA failover.
- Data: content poisoning / eval regression / vector corruption.

## 12.5 Recovery cheatsheet

- **Full re-ingest**: `POST /api/v1/ops/reindex` per workspace (idempotent, resumes).
- **Source re-crawl**: `POST /sources/{id}/crawl {"kind":"full"}`.
- **Snapshot restore (Qdrant)**: restore collection snapshot, then reconcile chunk store.
- **PITR (Postgres)**: pg_basebackup + WAL replay to RPO=0.
