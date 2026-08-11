# 13 — Disaster Recovery

## 13.1 Targets

| Objective | Target |
|-----------|--------|
| RPO | 0 (synchronous replication / WAL archiving) |
| RTO | < 15 minutes |
| Data loss | zero for committed metadata/chat; derived vectors rebuildable from chunks |
| Uptime | 99.99% (multi-AZ, HA) |

## 13.2 Backups

| Asset | Method | Frequency | Retention |
|-------|--------|-----------|-----------|
| Postgres | PITR: WAL archiving to object storage + daily full (`pg_basebackup`) | continuous | 30d |
| Redis | RDB snapshots + AOF | 5m RDB | 7d |
| Qdrant | Collection snapshots (S3) + chunk-store rebuild | hourly | 7d |
| Object storage | Region replication | — | — |
| Config/K8s | Git (IaC) | — | forever |

Derived assets (Qdrant, caches) are *reconstructible* from Postgres chunk store + embedding model —
restore order: Postgres → Qdrant-from-chunks (parallel re-embed) → cache warm.

## 13.3 Recovery procedures

### Database loss (single instance)
Automatic failover to replica (streaming replication, synchronous commit for RPO=0).

### Region loss
1. Promote DR region (async replication to DR site).
2. Restore latest backups (PITR) if DR lag.
3. Re-embed Qdrant in parallel (idempotent; progress checkpointed).
4. Repoint DNS → cutover (TTL low on API/web records).
5. Verify eval + health, then close incident.

### Vector DB full loss
Qdrant rebuild from Postgres `chunks` where `embedded=true`:
`celery -A app.workers.celery_app call app.workers.tasks.rebuild_vectors` — parallel, resumable,
idempotent.

## 13.4 Chaos & drills

- Monthly restore drill: restore full stack in staging from backups; assert eval score ≥ baseline.
- Quarterly chaos: kill Qdrant/Redis/DB nodes, verify graceful degradation + recovery.
- Game-day scenarios: provider outage, poisoned content, webhook flood.

## 13.5 Redundancy matrix

| Component | Redundancy |
|-----------|------------|
| API/Web/Workers | N replicas multi-AZ, HPA, PDB |
| Postgres | Primary + 2 replicas (sync, async DR) |
| Redis | Cluster (primary+replicas) |
| Qdrant | Replica set / cluster, snapshots |
| DNS/TLS | Managed, low TTL |
| Secrets | KMS multi-region |
