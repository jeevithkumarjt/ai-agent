# 14 — Scaling & Cost Estimation

## 14.1 Capacity model (Tryvium website baseline)

Assumptions: ~1,500 pages, avg 8 KB text/page, avg 12 chunks/page → **~18k chunks**.
Embedding dim 1024 (float32) ≈ 4 KB/vector → ~72 MB dense + sparse. Trivially small.

Enterprise scale-out cases: 1M chunks ≈ 4 GB dense vectors — Qdrant handles on 2 small nodes with
quantization (binary → ~1 GB).

## 14.2 Latency budget (uncached < 2s P95)

| Stage | Budget |
|-------|--------|
| AuthZ + rate limit + memory | 15 ms |
| Intent + rewrite (fast model) | 250 ms |
| Hybrid retrieval (dense+sparse+RRF) | 80 ms |
| Rerank (top-24, cross-encoder) | 250 ms |
| Compression + grounding | 150 ms |
| Synthesis (stream start) | 400 ms |
| Validate + cache | 50 ms |

## 14.3 Autoscaling

- **API**: HPA on `cpu` (70%) + request latency (P50 > 800ms scale-up).
- **Workers**: KEDA ScaledObject on Redis Stream length (`CELERY_QUEUE`) → min 2 / max 40.
- **Crawler**: horizontal worker pods; per-host concurrency caps.
- **Qdrant**: cluster with replicas; node count = f(dim × chunks / node capacity).

## 14.4 Cost model (monthly, approximate, US, managed services)

| Item | Small (start) | Medium (enterprise trial) | Large |
|------|---------------|---------------------------|-------|
| API/web nodes (2–8 cpus) | $150 | $600 | $2,400 |
| Workers | $100 | $400 | $1,600 |
| Postgres (managed) | $120 | $400 | $1,500 |
| Redis | $60 | $180 | $600 |
| Qdrant (cloud) | $80 | $350 | $1,400 |
| Object storage | $10 | $40 | $150 |
| Observability | $40 | $120 | $400 |
| **Infra subtotal** | **$560** | **$2,090** | **$8,050** |
| Embeddings (local fastembed) | $0 | $0 | $0 |
| LLM (estimate) | $100 | $800 | $5,000 |
| **Total** | **~$660/mo** | **~$2,900/mo** | **~$13,000/mo** |

Levers: cache-first (response cache kills repeat LLM cost), AI cost optimizer (small model for
simple questions), local embeddings, quantized vectors, autoscaling to zero at night (workers).

## 14.5 Cost governance

- Budget alerts at 70%/90% per cost center (per tenant).
- `agentai_tokens_total` per provider/model/tenant → dashboard + billing attribution.
- Per-tenant quotas (messages/day, sources, docs) enforced in API layer.
- Model routing rules per tenant (e.g., EU tenant → Mistral).
