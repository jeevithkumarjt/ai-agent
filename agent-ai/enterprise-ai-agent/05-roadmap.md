# Roadmap

**Status: Locked.** Phase 1 is what is being built. Later phases are deliberately not designed in
detail here — they are additive because the seams (ADR-004 tenant scoping, ADR-002 tool contract,
ADR-003 Web Component, ADR-007 env-config) are already in place.

## Phase 1 — MVP (this build)

- [x] Single Postgres + pgvector database (ADR-001)
- [x] Custom Anthropic `tool_use` orchestration loop with hard guardrails (ADR-002)
- [x] One real tool: `search_knowledge_base` (RAG retrieval as a tool call)
- [x] Offline/batch ingestion CLI (chunk ~500 tokens / 50 overlap, embed, store)
- [x] JWT auth with `tenant_id` claim + refresh flow (ADR-005)
- [x] Structured JSON logging (ADR-006) and env-only secrets (ADR-007)
- [x] No-op rate-limit middleware seam in the pipeline (ADR-008)
- [x] Web Component chat widget (React + Vite library mode, Shadow DOM) (ADR-003)
- [x] WebSocket streaming with SSE fallback
- [x] Local dev `docker-compose.yml` (pgvector + backend)

## Phase 2 — Enterprise tooling

- Real rate limiting implementation behind the ADR-008 seam.
- D365 CRM tool (read accounts/cases from a tenant-scoped view).
- Brevo email tool (send + template library).
- Exelare ATS tool (candidate + job reads).
- Widget theming API and host-side event consumption.

## Phase 3 — Scale & hardening

- Dedicated vector store only if >10M vectors or measured latency problems (ADR-001).
- Monitoring dashboards and CI/CD (seams already in place).
- Multi-region, SSO/SAML.
