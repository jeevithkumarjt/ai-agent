# Enterprise AI Agent — Complete End-to-End Architecture

> **Scope of this document:** Consolidated, authoritative reference for the
> `agent-ai/enterprise-ai-agent/` project (the implemented MVP) plus a summary of the
> co-located platform monorepo at the repo root. It merges the existing design docs
> (`01-architecture-decisions.md` → `06-system-overview.md`, `STRUCTURE_AND_TECHNOLOGY.md`,
> `VALIDATION_REPORT.md`) with a direct read of the source.
>
> **Status (verified):** Phase 1 MVP is built, deployed to Render, and fully validated
> (see §12). Last validation: 2026-08-11.

---

## 1. What this system is

A production-ready, **multi-tenant-ready** enterprise AI knowledge assistant ("TryMe AI").
It ingests company documents (`documents/`) and crawls configurable websites
(`KNOWLEDGE_SITES`, e.g. `https://www.tryvium.ai`), keeps an in-memory lexical index plus
a Postgres+pgvector store, and answers end-user questions through a streaming chat UI with
grounded, cited responses. A full admin portal lets owners/admins manage knowledge,
users, analytics, audit, settings, backups, and notifications.

**Brand surface:** "TryMe AI — Enterprise Assistant" (chat) / "TryMe Enterprise AI — Admin
Portal" (admin).

---

## 2. Two architectures in the same repo (important)

Your GitHub repo `jeevithkumarjt/ai-agent` contains **two related but distinct builds**:

| | `agent-ai/enterprise-ai-agent/` (this MVP) | Repo-root `apps/`, `infra/`, `docs/` (platform vision) |
|---|---|---|
| Backend | FastAPI + custom tool loop + **pgvector** | FastAPI (hexagonal/DDD) in `apps/api` + **Celery** workers |
| Vector store | Postgres `pgvector` (single DB) | **Qdrant** (separate), Redis streams/queues |
| Frontend | Vanilla `admin-ai.html` + `index.html`/`main.html` + React widget | Next.js (App Router) `apps/web` (chat + admin dashboard) |
| Infra | `docker-compose.yml` + `render.yaml` | Docker Compose + **Helm chart + Terraform**, Prometheus/Grafana/Loki, OTel |
| RAG | BM25 (in-memory) **and** pgvector cosine (dual path) | Incremental crawl, SHA-256 hashing, re-embed only changed chunks, multi-layer cache |
| Maturity | Built, deployed, validated | Described in root `README.md` / `docs/` — design/forward-looking |

This document details the **MVP** (what is actually running). The platform monorepo is the
scale-out target (see §13).

---

## 3. High-level architecture (MVP)

```
┌────────────────────────────── FRONTENDS ──────────────────────────────┐
│  admin-ai.html (Admin SPA, vanilla)                                   │
│  index.html / main.html (Chat UI, vanilla; main.html adds Web Speech) │
│  frontend/  <ai-agent-widget>  (React+Vite Web Component, embeddable) │
│  api-config.js → window.APP_API_BASE (backend URL for static pages)   │
│  No credentials in static files → guest session via POST /v1/auth/guest│
└──────────────────────────────┬───────────────────────────────────────┘
                                │ HTTPS (REST + SSE / WebSocket)
┌──────────────────────────────▼───────────────────────────────────────┐
│              FastAPI backend  (Docker / Render)                        │
│  api/        routes: auth, conversations, knowledge, health, admin/*  │
│  core/       settings, security, rbac, LLM clients, embeddings, rate  │
│  services/   orchestrator (agent loop), rag, knowledge, portal, tools │
│  db/         SQLAlchemy models + async session                        │
│  alembic/    migrations (schema.sql → 0001 + 0002 lexical tsv)        │
│  Background loops: knowledge refresh (docs+crawl) + portal auto-sync  │
└──────────────────────────────┬───────────────────────────────────────┘
                                │
                ┌───────────────┴────────────────┐
                │  PostgreSQL 16 + pgvector      │
                │  one DB = relational + vector  │
                └────────────────────────────────┘
```

**Three deployable tiers:**
1. **Frontend** — static HTML/JS on GitHub Pages (or any static host). Optional React widget build.
2. **Backend** — FastAPI service (Render web service / Docker) owning auth, the agent tool loop, RAG, and admin APIs.
3. **Database** — one Postgres instance doubling as the vector store via the `pgvector` extension.

---

## 4. Technology stack

### Backend (`backend/`)
| Layer | Technology | Version |
|-------|-----------|---------|
| Language | Python | 3.12+ |
| Web framework | FastAPI | >=0.115 |
| ASGI server | Uvicorn | >=0.30 |
| Validation / config | Pydantic + pydantic-settings | >=2.7 / >=2.2 |
| ORM | SQLAlchemy (asyncio) | >=2.0.30 |
| Postgres driver | asyncpg | >=0.29 |
| Vector store | pgvector | >=0.3 |
| Migrations | Alembic | >=1.13 |
| Auth | PyJWT (HS256 access+refresh), pwdlib[argon2] | >=2.8 / >=0.2 |
| HTTP client | httpx | >=0.27 |
| Logging | structlog (structured JSON) | >=24.1 |
| Streaming | SSE (`StreamingResponse`) + WebSockets | — |
| Tokenizer | tiktoken (cl100k_base) | >=0.7 |
| Doc parsing | pypdf, python-docx, openpyxl, python-pptx | — |
| LLM providers | Anthropic Messages API **or** Groq (OpenAI-compatible) | — |
| Embeddings | OpenAI-compatible (`text-embedding-3-small`, 1536-d) | — |
| Dev/QA | pytest, pytest-asyncio, ruff, mypy (strict) | — |

### Frontends
| Surface | File(s) | Technology |
|---------|---------|-----------|
| Admin portal | `admin-ai.html` | Single static HTML, vanilla JS + CSS custom properties (dark/light) |
| Chat UI (text) | `index.html` | Single static HTML, vanilla JS, REST + SSE |
| Chat UI (voice) | `main.html` | Same + Web Speech API |
| Legal page | `privacy.html` | Static |
| Embeddable widget | `frontend/` | React 18 + Vite 5 **library mode** → custom element in Shadow DOM |
| API base config | `api-config.js` | Sets `window.APP_API_BASE` |

### Infrastructure
| Piece | Technology |
|-------|-----------|
| DB image | `pgvector/pgvector:pg16` |
| Local | `docker-compose.yml` (postgres + backend) |
| Cloud | `render.yaml` Blueprint (web service + cron keep-alive + managed Postgres) |
| Repo-scale | Helm chart + Terraform in repo-root `infra/` (platform vision) |
| Quality gate | `ruff` + `mypy --strict` in `pyproject.toml` |

---

## 5. Full directory layout (MVP)

```
enterprise-ai-agent/
├── .env.example                      # every config key, documented
├── README.md                         # setup + deployment guide
├── 01-architecture-decisions.md      # ADR-001..008 (locked)
├── 02-agent-and-rag-workflow.md      # LLM tool loop + RAG design
├── 03-data-model.md                  # data model doc
├── 04-api-contract.md                # API doc
├── 05-roadmap.md                     # roadmap
├── 06-system-overview.md             # system overview + session notes
├── STRUCTURE_AND_TECHNOLOGY.md       # full structure + stack
├── VALIDATION_REPORT.md              # 2026-08-11 end-to-end validation
│
├── backend/                          # ★ FASTAPI APPLICATION
│   ├── main.py                       # app factory, middleware, lifespan, service wiring
│   ├── cli.py                        # `seed` (bootstrap tenant+owner) & `ingest` (KB)
│   ├── Dockerfile
│   ├── pyproject.toml                # deps + ruff/mypy/pytest config
│   ├── alembic.ini
│   ├── alembic/
│   │   ├── env.py
│   │   ├── script.py.mako
│   │   └── versions/
│   │       ├── 0001_initial_schema.py    # core schema (from database/schema.sql)
│   │       └── 0002_lexical_tsv.py       # document_chunks.tsv generated column + GIN
│   ├── api/                          # ★ HTTP ROUTES (all under /v1)
│   │   ├── deps.py                   # Principal + require_auth dependency
│   │   ├── schemas.py                # Pydantic request/response models
│   │   ├── streaming.py              # SSE event helper
│   │   ├── health.py                 # GET /v1/health
│   │   ├── auth.py                   # /v1/auth/{guest,login,refresh}
│   │   ├── conversations.py          # create, history, SSE send, WebSocket
│   │   ├── knowledge.py              # public knowledge endpoints
│   │   └── admin/                    # ★ admin SPA API (RBAC-guarded, tenant-scoped)
│   │       ├── __init__.py           # admin_router → /v1/admin
│   │       ├── deps.py               # admin dependency + role check
│   │       ├── analytics.py
│   │       ├── knowledge.py          # upload / edit / versions / retrain / crawl
│   │       ├── system.py             # settings, backup/restore, audit, notifications
│   │       ├── unanswered.py
│   │       └── users.py
│   ├── core/                         # ★ CONFIG + CROSS-CUTTING
│   │   ├── settings.py               # pydantic Settings (env-driven, ADR-007)
│   │   ├── security.py               # Argon2 password hashing
│   │   ├── auth.py                   # JWT encode/decode (access 30min / refresh 14d)
│   │   ├── rbac.py                   # role→scope map (owner/admin/editor/viewer)
│   │   ├── guest_limits.py           # per-session guest message caps
│   │   ├── rate_limit.py             # RateLimitMiddleware (per-IP)
│   │   ├── logging.py                # structlog setup
│   │   ├── embeddings.py             # Embedder + LocalHash dev fallback (disabled in prod)
│   │   ├── anthropic_client.py       # Anthropic Messages API client (custom, no SDK)
│   │   └── openai_compat_client.py   # Groq / OpenAI-format client
│   ├── db/                           # ★ DATA LAYER
│   │   ├── session.py                # async engine + session factory
│   │   ├── models.py                 # core tables (tenants, users, conversations, messages, document_chunks, tool_calls)
│   │   └── admin_models.py           # portal tables (admin_settings, audit, backups, notifications, …)
│   └── services/                     # ★ BUSINESS LOGIC
│       ├── orchestrator.py           # LLM tool loop (agent loop)
│       ├── rag.py                    # chunking + pgvector cosine retrieval (tool path)
│       ├── knowledge.py              # in-memory BM25 store + site crawl (prompt-grounding path)
│       ├── portal.py                 # admin portal service (document lifecycle, analytics, etc.)
│       └── tools/
│           ├── base.py               # BaseTool + tool-map builder
│           └── search_knowledge_base.py  # the one shipped tool
│
├── frontend/                         # ★ EMBEDDABLE WIDGET (React + Vite)
│   ├── package.json
│   ├── vite.config.js                # library mode → dist/agent-widget.js
│   ├── index.html
│   └── src/
│       ├── main.jsx                  # Web Component <ai-agent-widget> (Shadow DOM)
│       ├── components/
│       │   ├── ChatWidget.jsx
│       │   └── styles.css
│       └── lib/
│           ├── api.js                # fetch wrapper + login/refresh/conversation/history
│           ├── auth.js               # in-memory token store
│           └── stream.js             # SSE + WebSocket stream clients
│
├── database/
│   ├── schema.sql                    # canonical DDL
│   └── erd.md                        # entity-relationship diagram
│
├── documents/                        # ★ KNOWLEDGE BASE SOURCES
│   ├── doc/*.docx                    # ingested company docs (AWS, Azure, GCP, policies…)
│   ├── manual/                       # admin-portal-created docs
│   ├── test_kb_doc.md
│   └── (csv/json/html/md/pdf/xlsx/pptx …)
│
├── api/openapi.yaml                  # API contract (source of truth for wire format)
│
├── admin-ai.html                     # ★ admin portal SPA (vanilla JS)
├── index.html                        # ★ chat UI (text)
├── main.html                         # ★ chat UI (voice)
├── privacy.html                      # static legal page
├── api-config.js                     # window.APP_API_BASE for GitHub Pages frontends
├── docker-compose.yml                # postgres + backend
├── render.yaml                       # Render Blueprint deployment
└── keepalive/
    ├── Dockerfile                    # cron image
    └── keepalive.sh                  # pings /v1/health every 10 min
```

---

## 6. Backend in detail

### 6.1 Bootstrap — `backend/main.py`
- `create_app()` adds `RateLimitMiddleware` + CORS and mounts `health`, `auth`,
  `conversations`, `knowledge`, `admin_router`.
- `lifespan` startup:
  1. Creates admin-portal tables (`AdminBase.metadata.create_all` — a separate registry, **not** Alembic-managed).
  2. `_build_services()` wires the app into `app.state`:
     - LLM client → `OpenAICompatClient` (Groq) **or** `AnthropicClient` (per `LLM_PROVIDER`).
     - `RagService(embedder)` → pgvector retrieval.
     - `KnowledgeStore` → in-memory BM25 over `documents/` + site crawl.
     - `PortalService` → all admin operations.
     - `Orchestrator(llm, tools, rag, portal)` → the agent tool loop.
  3. Starts background loops: **knowledge refresh** and **portal auto-sync**.

### 6.2 API surface (`/v1`)
| Router | Endpoints | Purpose |
|--------|-----------|---------|
| `health` | `GET /v1/health` | liveness + embeddings status |
| `auth` | `POST /v1/auth/guest` · `POST /v1/auth/login` · `POST /v1/auth/refresh` | anonymous guest, password login, token refresh |
| `conversations` | `POST /v1/conversations` · `GET /{id}/messages` · `POST /{id}/messages` (SSE) · `WS /{id}/ws` | chat lifecycle + streaming |
| `knowledge` | `GET /v1/knowledge/status` (+ thin wrapper) | public KB status |
| `admin/*` | `analytics` · `knowledge` · `unanswered` · `users` · `system` | full admin portal (all RBAC-guarded) |

Full admin endpoints (RBAC + tenant-scoped):
- `/knowledge`: list/status/jobs, `/{id}` + `/versions`, edit/delete/rollback/upload/retrain/sync
- `/unanswered`: list, `/{id}/answer`
- analytics: `/overview`, `/analytics/trends`, `/top-queries`, `/funnel`, `/distribution`, `/document-usage`, `/conversations`, `/conversations/{id}`, `/feedback`
- `/users`: list, `/invite`, PATCH `/{id}`, `/activity`
- system: `/me`, `/audit`, `/notifications`, `/settings`, `/api-keys`, `/backup`, `/backup/restore`, `/export-conversations`, `/jobs`

### 6.3 Auth & security
- **Passwords:** Argon2 (`pwdlib`) in `core/security.py`.
- **JWT:** HS256, 30-min access + 14-day refresh; claims carry `tenant_id`, `user_id`, `role`, `guest`, `sid`.
- **RBAC:** `core/rbac.py` maps role → scopes (owner / admin / editor / viewer). Role is **resolved live from the DB row** on every admin request, so deactivation/role changes apply immediately.
- **Guests:** anonymous visitors get viewer-scoped, rate-limited tokens via `POST /v1/auth/guest`; per-IP rate limit + hard `GUEST_MESSAGE_LIMIT` cap enforced before any LLM work.
- **Tenant isolation:** every query filtered by `tenant_id`; cross-tenant access returns **404** (not 403) to avoid leaking existence.

### 6.4 Agent loop — `services/orchestrator.py`
`stream_reply(...)` runs the LLM tool loop:
1. Load per-tenant conversation history (reconstructed to the LLM's wire format).
2. Ground the system prompt with retrieved context (BM25 path, see §7).
3. Call the LLM; if it emits `tool_use`, validate input against the tool's pydantic schema, execute (tenant-scoped), append `tool_result`, and repeat — up to `AGENT_MAX_TOOL_ITERATIONS` (5).
4. Stream typed events: `user_message`, `text_delta`, `tool_call_started`, `tool_call_completed`, `message_done` (+citations), `error`.
5. Persist every turn (`messages` role user/assistant/tool) and record metrics.

Guardrails: max 5 tool iterations; every tool call structured-logged + persisted to `tool_calls`; tool errors return a structured error to the LLM (never crash the request).

### 6.5 RAG — two distinct retrieval paths (verified in source)
> **Note:** Earlier docs (`02-*`, `STRUCTURE_AND_TECHNOLOGY.md`) describe a single "hybrid
> ts_rank + pgvector" retriever. The actual code implements **two separate paths**:

| Path | Implementation | When used |
|------|----------------|-----------|
| **Lexical (BM25)** | `KnowledgeStore` in `services/knowledge.py` — in-memory BM25 index over `documents/` + crawled site, stdlib-only, rebuilt each refresh | **Always** — top-k chunks are prepended to the system prompt as "# Retrieved knowledge for this question" |
| **Vector (pgvector)** | `RagService` in `services/rag.py` — cosine distance `embedding <=> :q` against `document_chunks`, flat scan (fine < ~50k rows) | **Inside** the `search_knowledge_base` tool — explicit tool call the LLM may choose to invoke |

- **Chunking:** token-aware via `tiktoken` (`cl100k_base`), target ~500 tokens, ~50-token overlap; char fallback if tiktoken missing (`rag.py:chunk_text`).
- **Embeddings:** OpenAI-compatible endpoint (`text-embedding-3-small`, 1536-d). A `LocalHash` fallback exists for dev/tests but real ingestion/retrieval **refuses** to use it (ADR-007).
- `document_chunks` also carries a generated `tsv` (lexical) column + GIN index (migration `0002_lexical_tsv.py`) for future SQL-side lexical search, but the live BM25 path is in-process.

### 6.6 Knowledge store — `services/knowledge.py`
- Parses `.txt/.md/.markdown/.rst/.text/.log/.html/.htm/.xml/.csv/.json/.pdf/.docx/.xlsx/.pptx` from `documents/` and crawls `KNOWLEDGE_SITES` (sitemap discovery, max `KNOWLEDGE_MAX_SITE_PAGES`) into an in-memory BM25 index.
- Runs at startup and on a `KNOWLEDGE_REFRESH_MINUTES` loop; `refresh_documents_only()` supports admin uploads without re-crawling.
- `.docx`/`.pdf`/`.xlsx`/`.pptx` require their optional deps (declared in `pyproject.toml`, installed in the Docker image).

### 6.7 Portal service — `services/portal.py`
The whole admin backend: document upload/edit/versions/rollback/retrain, site crawl, analytics ingestion, unanswered questions, users/roles/invitations, settings, audit log, backup/restore, notifications, API keys, train jobs.

---

## 7. Frontend in detail

### 7.1 Admin Portal — `admin-ai.html`
- Zero-build single static HTML (inline CSS + vanilla JS). Dark/light theme via CSS custom properties, brand "TryMe".
- Consumes only `/v1/admin/*`. Login → stores access+refresh in `localStorage` → auto-refresh → logout clears.
- Overview page: 8 clickable stat cards, quick-action buttons, live 30s poll, SVG trends chart, recent-activity feed (from audit trail).

### 7.2 Chat UI — `index.html` (text) and `main.html` (voice)
- Static HTML, vanilla JS, glass/dark aesthetic. `main.html` adds Web Speech API.
- Flow: `POST /v1/auth/guest` → viewer token → `ensureSession()` restores/refreshes → create conversation → stream over SSE rendering `text_delta`, tool indicators, citations. Past `GUEST_MESSAGE_LIMIT`, prompts login to save the conversation.

### 7.3 Embeddable Widget — `frontend/` (React + Vite)
- Vite **library mode** → one self-contained ES module `dist/agent-widget.js` (+ `style.css`); React/React-DOM externalized (host provides).
- `src/main.jsx` defines `<ai-agent-widget>` (attrs `api-base`, `token`, `tenant-id`) rendering inside **Shadow DOM**.
- Tokens live **in memory only**; on 401 the widget dispatches a composed `auth_needed` event for the host to supply a token.
- Embed with: `<script type="module" src="/agent-widget.js"></script><ai-agent-widget api-base="…"></ai-agent-widget>`.

---

## 8. Data model (Postgres + pgvector)

Every tenant-owned table carries `tenant_id` (ADR-004); every query filters by it.

**Core tables** (`db/models.py`, Alembic-managed):
| Table | Key columns | Notes |
|-------|-------------|-------|
| `tenants` | `id, name, created_at` | one row today, schema ready for more |
| `users` | `id, tenant_id, email, role, password_hash` | owner/admin/editor/viewer |
| `conversations` | `id, tenant_id, user_id, created_at` | one per chat session |
| `messages` | `id, conversation_id, tenant_id, role, content, tool_calls jsonb` | role = user/assistant/tool |
| `document_chunks` | `id, tenant_id, source_id, chunk_text, embedding vector(1536), metadata jsonb, tsv` | RAG store |
| `tool_calls` | `id, conversation_id, tenant_id, tool_name, input, output, duration_ms, success` | audit/debug trace |

**Admin tables** (`db/admin_models.py`, created at startup via `create_all`):
| Table | Purpose |
|-------|---------|
| `admin_documents` / `admin_document_versions` | knowledge docs + version history (checksum, status draft/indexed/error) |
| `unanswered_questions` | low-confidence/unanswered questions surfaced to admins |
| `answer_metrics` | per-answer confidence, response time, tool calls |
| `audit_logs` | every admin action |
| `notifications` | portal notifications |
| `admin_settings` | per-tenant settings (`retrieval_top_k`, `auto_sync_minutes`, `api_keys`, `disabled_users`, …) |
| `train_jobs` | background ingest/retrain/sync progress |
| `message_feedback` | thumbs up/down ratings + comments |

**Indexes:** `tenant_id` on every table (composite with primary lookup where applicable). `ivfflat` on `document_chunks.embedding` **skipped for MVP** row counts (flat scan fine < ~50k rows, ADR-001); DDL is commented in `schema.sql`. `GIN` on `document_chunks.tsv` (migration 0002).

Full DDL: `database/schema.sql`; ER diagram: `database/erd.md`.

---

## 9. End-to-end chat flow

```
User types message
  → ensureSession(): guest token or login tokens (JWT access 30m / refresh 14d)
  → POST /v1/conversations                 (tenant-scoped row created)
  → POST /v1/conversations/{id}/messages   → SSE stream
       orchestrator.stream_reply:
         - load + reconstruct history (tenant-scoped)
         - KnowledgeStore.search(query) → top-k BM25 chunks  → prepended to system prompt
         - LLM call → may emit tool_use: search_knowledge_base
              → RagService.search (pgvector cosine, tenant-filtered) → tool_result
              → loop (max AGENT_MAX_TOOL_ITERATIONS = 5)
         - stream events: text_delta → tool_call_started/completed → message_done(+citations)
  → messages + metrics persisted to Postgres
  → guest path rate-limited + capped at GUEST_MESSAGE_LIMIT
```

---

## 10. Configuration cheat-sheet (`.env.example`)
| Key | Default | Purpose |
|-----|---------|---------|
| `DATABASE_URL` | `postgresql+asyncpg://…` | Postgres + pgvector DSN |
| `LLM_PROVIDER` | `groq` | `groq` (OpenAI-format) or `anthropic` |
| `GROQ_API_KEY` / `GROQ_MODEL` | `llama-3.3-70b-versatile` | Groq LLM |
| `ANTHROPIC_API_KEY` / `ANTHROPIC_MODEL` | `claude-sonnet-4-5` | Anthropic LLM |
| `EMBEDDINGS_API_KEY` / `EMBEDDINGS_MODEL` | `text-embedding-3-small` | embeddings (1536-d) |
| `JWT_SECRET` | — | 32+ char random |
| `RETRIEVAL_TOP_K` | 5 | vector retrieval top-k |
| `KNOWLEDGE_SITES` | `https://www.tryvium.ai/` | site crawl targets |
| `KNOWLEDGE_DOCS_DIR` | `documents` | local KB dir |
| `KNOWLEDGE_MAX_SITE_PAGES` / `KNOWLEDGE_REFRESH_MINUTES` | — | crawl/refresh cadence |
| `GUEST_MESSAGE_LIMIT` | 10 | anonymous chat cap |
| `AGENT_MAX_TOOL_ITERATIONS` | 5 | tool-loop guardrail |
| `BOOTSTRAP_OWNER_EMAIL/PASSWORD` | — | first admin (seeded via `cli.py seed`) |

---

## 11. Deployment

- **Local:** `docker compose up -d postgres` → `pip install -e "backend[dev]"` → `alembic upgrade head` → `python -m backend.cli seed` → `uvicorn backend.main:app --reload --port 8000`.
- **All-in-Docker:** `docker compose up -d --build`.
- **Render Blueprint (`render.yaml` at repo root):** provisions `ai-agent-db` (Postgres, pgvector) + `ai-agent-backend` (Docker) + `ai-agent-keepalive` (cron pinging `/v1/health` every 10 min). Migrations + seed run automatically on boot.
  - ⚠️ Default plan = free tier (spins down after ~15 min; free Postgres deleted after 30 days). Before real customers, set web `plan: starter`+ and DB `plan: basic-256mb`+.
- **Docker image (`backend/Dockerfile`):** copies `backend/` + `documents/`; installs python-docx, pypdf, openpyxl, python-pptx.
- **Frontends on GitHub Pages:** set backend URL in `api-config.js` (`window.APP_API_BASE`) and re-push.
- **Widget:** `cd frontend && npm install && npm run build` → `dist/agent-widget.js`.

---

## 12. Validation status (2026-08-11, `VALIDATION_REPORT.md`)

- **100%** of admin API surfaces exercised and passing; full RBAC matrix validated (owner/editor/viewer/other-tenant owner) incl. deny (403) and tenant isolation (404).
- Live chat through the real pipeline produced LLM responses, RAG citations, answer metrics, and auto-captured unanswered questions.
- All write flows tested: invite, role change, deactivate/reactivate, manual doc, multipart upload, edit/versions/rollback/delete, retrain, sync, backup, restore, CSV export, API keys, settings, notifications.
- **8 issues found & fixed during validation:** expired-JWT→401, settings cache invalidation, `disabled_users`/`api_keys` default persistence, DB-resolved RBAC role, audit actor-email resolution, ruff line-length, and the missing `qa()` helper that disabled all admin button bindings.
- Final state: 147 sources / 134 chunks indexed; `ruff` clean; frontend `node --check` + jsdom DOM test PASS; all components healthy.

### Known gap
**Feedback has no ingestion route.** `PortalService.submit_feedback()` exists but is never called — no POST endpoint backs it (admin only has `GET /feedback`). Consequence: satisfaction metric + "Recent feedback" widget stay empty. **Recommended fix:** add `POST /v1/conversations/{id}/messages/{message_id}/feedback` in `backend/api/conversations.py`.

---

## 13. Roadmap

**Phase 1 — MVP (done):** single Postgres+pgvector, custom tool loop, one tool (`search_knowledge_base`), batch ingest CLI, JWT+refresh, structured logging, env-only secrets, no-op rate-limit seam, Web Component widget, WebSocket+SSE, local docker-compose.

**Phase 2 — Enterprise tooling:** real rate limiting behind the ADR-008 seam; D365 CRM tool; Brevo email tool; Exelare ATS tool; widget theming + host events.

**Phase 3 — Scale & hardening:** dedicated vector store only if >10M vectors or measured latency (ADR-001); monitoring/CI-CD; multi-region; SSO/SAML.

### Platform monorepo (repo root `apps/`, `infra/`, `docs/`)
The repo-root `README.md` describes the scale-out target: FastAPI (hexagonal/DDD) + Celery workers + **Qdrant** vector store + Redis streams + Next.js `apps/web` dashboard, deployed via Helm/Terraform with Prometheus/Grafana/Loki and OpenTelemetry. This is the forward-looking architecture; `enterprise-ai-agent` is the currently-running, validated implementation.

---

## 14. Architecture Decision Records (ADR-001..008, locked)
1. **Single DB** for relational + vector (Postgres + pgvector).
2. **Custom tool loop**, not LangGraph/LangChain (<10 tools).
3. **Frontend ships as a Web Component** (framework-agnostic embed).
4. **Tenant scoping from day one** (`tenant_id` on every table).
5. **JWT with tenant claim**, not server-side sessions.
6. **Structured JSON logging** from first commit (structlog).
7. **Secrets via env vars only** (pydantic-settings; zero in git).
8. **Rate limiting stubbed** (no-op middleware seam) — to be implemented in Phase 2.

---

## 15. Quick file map (where to look)
| Concern | File |
|---------|------|
| App wiring, middleware, startup loops | `backend/main.py` |
| Agent loop + streaming events | `backend/services/orchestrator.py` |
| Vector RAG (pgvector) | `backend/services/rag.py` |
| Lexical BM25 + site crawl (prompt grounding) | `backend/services/knowledge.py` |
| Admin operations | `backend/services/portal.py` |
| Tool contract + `search_knowledge_base` | `backend/services/tools/` |
| Auth/JWT/RBAC/security | `backend/core/{auth,rbac,security}.py` |
| LLM clients | `backend/core/{anthropic_client,openai_compat_client}.py` |
| Embeddings | `backend/core/embeddings.py` |
| DB models + sessions | `backend/db/{models,admin_models,session}.py` |
| Canonical schema / ERD | `database/{schema.sql,erd.md}` |
| API contract (wire format) | `api/openapi.yaml` |
| Frontends | `admin-ai.html`, `index.html`, `main.html`, `frontend/` |
| Deploy | `docker-compose.yml`, `render.yaml`, `backend/Dockerfile` |
