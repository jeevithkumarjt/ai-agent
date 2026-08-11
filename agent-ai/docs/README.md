# Documentation Index

| # | Document | Purpose |
|---|----------|---------|
| 01 | [01-architecture.md](01-architecture.md) | System architecture, C4 context, flows, ADRs |
| 02 | [02-technology-matrix.md](02-technology-matrix.md) | Technology decision matrix with rationale |
| 03 | [03-domain-model.md](03-domain-model.md) | Core entities, ER diagram, invariants |
| 04 | [04-api-spec.md](04-api-spec.md) | Every endpoint, schemas, validation, errors, examples |
| 05 | [05-database-design.md](05-database-design.md) | Postgres schema, indexes, partitioning, migrations |
| 06 | [06-rag-pipeline.md](06-rag-pipeline.md) | Retrieval, reranking, grounding, confidence, hallucination guard |
| 07 | [07-ingestion.md](07-ingestion.md) | Crawler, parsers, chunking, embeddings, versioning, invalidation |
| 08 | [08-security.md](08-security.md) | AuthN/Z, RBAC, injection/PII/guardrails, audit, OWASP |
| 09 | [09-observability.md](09-observability.md) | OTel, Prometheus, Grafana, Loki, Sentry, AI metrics |
| 10 | [10-deployment.md](10-deployment.md) | Docker, K8s/Helm, Terraform, blue/green, canary |
| 11 | [11-ci-cd.md](11-ci-cd.md) | GitHub Actions pipelines, security scans, eval gates |
| 12 | [12-runbook.md](12-runbook.md) | Daily operations runbook |
| 13 | [13-disaster-recovery.md](13-disaster-recovery.md) | RPO/RTO, backups, restore drills |
| 14 | [14-scaling.md](14-scaling.md) | Capacity model, autoscaling, cost estimation |
| 15 | [15-roadmap.md](15-roadmap.md) | Sprint-by-sprint implementation roadmap |

Companion source-of-truth documents:

- Coding standards: [16-coding-standards.md](16-coding-standards.md)
- Architecture decision records: [17-adr.md](17-adr.md)
- Testing strategy: [18-testing.md](18-testing.md)
