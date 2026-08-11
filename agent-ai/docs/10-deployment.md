# 10 — Deployment

## 10.1 Environments

| Env | Infra | Purpose |
|-----|-------|---------|
| dev | Docker Compose (full stack) | local iteration |
| staging | K8s namespace, same image as prod | pre-prod eval gate |
| prod | K8s (EKS/AKS/GKE) multi-AZ | SaaS |

## 10.2 Docker Compose services (dev)

`infra/docker/docker-compose.yml`: `web`, `api`, `worker-default`, `worker-priority`,
`worker-index`, `crawler`, `postgres`, `redis`, `qdrant`, `minio`, `otel-collector`,
`prometheus`, `grafana`, `loki`, `promtail`, `jaeger`, `migrate` (one-shot).

## 10.3 Kubernetes + Helm

Chart `infra/helm/charts/agentai`:

- Deployments: `api` (HPA on cpu+p50 latency), `web`, `worker-*` (KEDA scaling on
  Redis-Streams queue length), `crawler`.
- Services: `api`, `web`, headless for workers.
- Ingress: TLS termination, WAF annotations, rate limiting at LB.
- Config: `ConfigMap` (non-secret) + `Secret` (KMS-backed).
- Probes: `liveness` (HTTP `/health/live`), `readiness` (`/health/ready`).
- PodDisruptionBudget, resource requests/limits, `priorityClassName`.
- Persistent volumes: Postgres (managed), Qdrant (managed disk + snapshots).

## 10.4 Zero-downtime releases

- **Blue/Green**: two full stacks behind the ingress; switch after eval + readiness; keep old for
  instant rollback.
- **Canary**: 5%→25%→100% traffic; gated by error rate + latency SLO + eval score.
- **Rolling**: default `maxUnavailable:0, maxSurge:25%`.
- **Automatic rollback**: Argo Rollouts / GH Actions gate auto-reverts on SLO breach.
- **Migrations**: `migrate` job runs Alembic before rollout; forward-only, expand/contract pattern
  for schema changes (add nullable → backfill → set NOT NULL → drop old).

## 10.5 Terraform

`infra/terraform/`: EKS module, node groups, managed Postgres (RDS) + Redis (ElastiCache) +
Qdrant, S3 buckets + KMS, IAM roles, VPC/networking, ACM certificates, Route53, WAF.

## 10.6 Image strategy

- Multi-stage builds; distroless runtime for API/web; pinned base digests; SBOM + sigstore cosign
  signing; `GITHUB_SHA` image tags, immutable.
- API image runs `python -m app` with `PYTHONUNBUFFERED=1`; web image runs `next start`.
