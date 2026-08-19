# Enterprise AI Agent — Full Structure & Technology Stack

> This document describes the complete front-end and back-end structure of the
> `agent-ai/enterprise-ai-agent` project and every technology it uses.

---

## 1. High-Level Overview

```
┌───────────────────────────  FRONTENDS  ─────────────────────────────┐
│                                                                     │
│  admin-ai.html        index.html / main.html        <ai-agent-widget>│
│  Admin Portal SPA     Chat UI (standalone)          React Web Component│
│  (vanilla JS)         (vanilla JS)                  (React + Vite)   │
│                                                                     │
└──────────────┬───────────────────┬──────────────────────┬───────────┘
               │ REST + SSE / WS   │ REST + SSE / WS      │ REST + SSE
               ▼                   ▼                      ▼
        ┌──────────────────────────── BACKEND ────────────────────────┐
        │                 FastAPI (Python 3.12, async)                 │
        │  /v1/auth · /v1/conversations · /v1/knowledge · /v1/admin/*  │
        │  middleware: CORS · RateLimit · JWT · RBAC · Guest limits    │
        │                                                              │
        │  Services: Orchestrator (LLM tool loop) · RAG · Knowledge    │
        │            · Portal (admin ops) · Tools (search KB)          │
        │  LLM clients: AnthropicClient | OpenAICompat (Groq)          │
        │  Embeddings: OpenAI-compatible (text-embedding-3-small)      │
        └───────────────────────────┬──────────────────────────────────┘
                                    ▼
        ┌─────────────────────────── DB ──────────────────────────────┐
        │  PostgreSQL 16 + pgvector  (one instance = data + vectors)  │
        │  SQLAlchemy async · Alembic migrations                      │
        └─────────────────────────────────────────────────────────────┘
```

---

## 2. Technology Stack

### Backend (`backend/`)
| Layer | Technology | Version |
|-------|-----------|---------|
| Language | Python | 3.12+ |
| Web framework | FastAPI | >=0.115 |
| ASGI server | Uvicorn (standard) | >=0.30 |
| Validation | Pydantic + pydantic-settings | >=2.7 / >=2.2 |
| ORM | SQLAlchemy (asyncio) | >=2.0.30 |
| Postgres driver | asyncpg | >=0.29 |
| Vector store | pgvector | >=0.3 |
| Migrations | Alembic | >=1.13 |
| Auth | PyJWT (HS256 access+refresh), pwdlib[argon2] | >=2.8 / >=0.2 |
| HTTP client | httpx | >=0.27 |
| Logging | structlog | >=24.1 |
| Streaming | SSE (StreamingResponse) + WebSockets + websockets | >=12.0 |
| Tokenizer | tiktoken (cl100k_base) | >=0.7 |
| Document parsing | pypdf, python-docx, openpyxl, python-pptx | — |
| LLM providers | Anthropic Messages API **or** Groq (OpenAI-compatible) | — |
| Embeddings | OpenAI-compatible endpoint (`text-embedding-3-small`, 1536-d) | — |
| Dev tooling | pytest, pytest-asyncio, ruff, mypy (strict) | — |
| Lint/style | ruff — `E,F,I,UP,B,SIM,ASYNC,C4`, line-length 100 | — |

### Frontends
| Surface | File(s) | Technology |
|---------|---------|-----------|
| Admin portal | `admin-ai.html` (89 KB) | Single HTML file, vanilla JS + CSS custom properties (dark/light), talks only to `/v1/admin/*` |
| Chat UI (text) | `index.html` (73 KB) | Single HTML file, vanilla JS, REST + SSE streaming, guest-auth flow |
| Chat UI (voice) | `main.html` (99 KB) | Single HTML file, vanilla JS, adds Web Speech voice interface |
| Legal page | `privacy.html` | Static |
| Embeddable widget | `frontend/` | React 18 + Vite 5 **library mode** → custom element `<ai-agent-widget>` inside Shadow DOM; React/React-DOM are externalized (host provides them) |
| API base config | `api-config.js` | Sets `window.APP_API_BASE` (backend URL for all HTML frontends) |

### Infrastructure
| Piece | Technology |
|-------|-----------|
| Database image | `pgvector/pgvector:pg16` |
| Containerization | Docker + `docker-compose.yml` (postgres + backend) |
| Deployment | `render.yaml` Blueprint (web service + cron keep-alive + managed Postgres) |
| Repo-scale infra | Helm chart + Terraform in repo-root `infra/` |
| CI quality | `ruff` + `mypy --strict` (configured in `pyproject.toml`) |

---

## 3. Full Directory Structure

```
enterprise-ai-agent/
├── .env.example                      # every config key, documented
├── README.md                         # setup + deployment guide
├── 01-architecture-decisions.md      # ADR-001..008
├── 02-agent-and-rag-workflow.md      # LLM tool loop + RAG design
├── 03-data-model.md                  # data model doc
├── 04-api-contract.md                # API doc
├── 05-roadmap.md                     # roadmap
├── 06-system-overview.md             # system overview
├── VALIDATION_REPORT.md
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
│   │
│   ├── api/                          # ★ HTTP ROUTES (all under /v1)
│   │   ├── deps.py                   # Principal + require_auth dependency
│   │   ├── schemas.py                # Pydantic response/request models
│   │   ├── streaming.py              # SSE event helper
│   │   ├── health.py                 # GET /v1/health
│   │   ├── auth.py                   # /v1/auth/{guest,login,refresh}
│   │   ├── conversations.py          # create, history, SSE send, WebSocket
│   │   ├── knowledge.py              # public knowledge endpoints
│   │   └── admin/                    # ★ admin SPA API (RBAC-guarded, tenant-scoped)
│   │       ├── __init__.py           # admin_router → /v1/admin
│   │       ├── deps.py               # admin dependency + role check
│   │       ├── analytics.py          # dashboards / stats (225 lines)
│   │       ├── knowledge.py          # upload / edit / versions / retrain / crawl
│   │       ├── system.py             # settings, backup/restore, audit, notifications
│   │       ├── unanswered.py         # unanswered-question tracking
│   │       └── users.py              # users + roles + invitations
│   │
│   ├── core/                         # ★ CONFIG + CROSS-CUTTING
│   │   ├── settings.py               # pydantic Settings (env-driven, ADR-007)
│   │   ├── security.py               # Argon2 password hashing
│   │   ├── auth.py                   # JWT encode/decode (access 30min / refresh 14d)
│   │   ├── rbac.py                   # role→scope map (owner/admin/editor/viewer)
│   │   ├── guest_limits.py           # per-session guest message caps
│   │   ├── rate_limit.py             # RateLimitMiddleware (per-IP)
│   │   ├── logging.py                # structlog setup
│   │   ├── embeddings.py             # Embedder abstraction + LocalHash dev fallback
│   │   ├── anthropic_client.py       # Anthropic Messages API client
│   │   └── openai_compat_client.py   # Groq / OpenAI-format client
│   │
│   ├── db/                           # ★ DATA LAYER
│   │   ├── session.py                # async engine + session factory
│   │   ├── models.py                 # core tables (tenants, users, conversations, messages, document_chunks, …)
│   │   └── admin_models.py           # portal tables (settings, audit, backups, notifications, …)
│   │
│   └── services/                     # ★ BUSINESS LOGIC
│       ├── orchestrator.py           # LLM tool loop (agent loop, 359 lines)
│       ├── rag.py                    # chunking + hybrid retrieval (ts_rank + pgvector cosine)
│       ├── knowledge.py              # document ingestion + site crawl (310 lines)
│       ├── portal.py                 # admin portal service (774 lines)
│       └── tools/
│           ├── base.py               # BaseTool + tool-map builder
│           └── search_knowledge_base.py  # the one shipped tool
│
├── frontend/                         # ★ EMBEDDABLE WIDGET (React + Vite)
│   ├── package.json                  # react, react-dom, vite, plugin-react
│   ├── vite.config.js                # library mode → dist/agent-widget.js
│   ├── index.html
│   └── src/
│       ├── main.jsx                  # Web Component: <ai-agent-widget> (Shadow DOM)
│       ├── components/
│       │   ├── ChatWidget.jsx        # chat UI logic (278 lines)
│       │   └── styles.css            # shadow-scoped styles (137 lines)
│       └── lib/
│           ├── api.js                # fetch wrapper + login/refresh/conversation/history
│           ├── auth.js               # in-memory token store
│           └── stream.js             # SSE + WebSocket stream clients
│
├── database/
│   ├── schema.sql                    # canonical schema
│   └── erd.md                        # entity-relationship diagram
│
├── documents/                        # ★ KNOWLEDGE BASE SOURCES
│   ├── doc/*.docx                    # ingested company docs (AWS, Azure, GCP, policies…)
│   └── test_kb_doc.md
│
├── api/openapi.yaml                  # API contract (source of truth for wire format)
│
├── admin-ai.html                     # ★ admin portal SPA (vanilla JS)
├── index.html                        # ★ chat UI (text) — TryMe AI
├── main.html                         # ★ chat UI (voice) — TryMe AI
├── privacy.html                      # static legal page
├── api-config.js                     # window.APP_API_BASE for GitHub Pages frontends
├── docker-compose.yml                # postgres + backend
├── render.yaml                       # Render Blueprint deployment
└── keepalive/
    ├── Dockerfile                    # cron image
    └── keepalive.sh                  # pings /v1/health every 10 min
```

---

## 4. Backend in Detail

### 4.1 Application bootstrap — `backend/main.py`
- `create_app()` builds the FastAPI app, adds **RateLimitMiddleware** and **CORS**, and mounts:
  - `health`, `auth`, `conversations`, `knowledge` routers + `admin_router`.
- `lifespan` on startup:
  1. Creates admin-portal tables (`AdminBase.metadata.create_all` — a separate registry, not Alembic-managed).
  2. `_build_services()` wires the whole app into `app.state`:
     - LLM client → `OpenAICompatClient` (Groq) **or** `AnthropicClient` based on `LLM_PROVIDER`.
     - `RagService(embedder)` → hybrid retrieval.
     - `KnowledgeStore` → documents + site-crawl ingestion.
     - `PortalService` → all admin operations.
     - `Orchestrator(llm, tools, rag, portal)` → the agent tool loop.
  3. Starts two background loops: **knowledge refresh** (docs + crawl) and **portal auto-sync**.

### 4.2 API surface (`/v1`)
| Router | Endpoints | Purpose |
|--------|-----------|---------|
| `health` | `GET /v1/health` | liveness + embeddings status |
| `auth` | `POST /v1/auth/guest` · `POST /v1/auth/login` · `POST /v1/auth/refresh` | anonymous guest tokens, password login, token refresh |
| `conversations` | `POST /v1/conversations` · `GET /{id}/messages` · `POST /{id}/messages` (SSE) · `WS /{id}/ws` | chat lifecycle + streaming |
| `knowledge` | public KB endpoints | (thin wrapper) |
| `admin/*` | `analytics` · `knowledge` · `unanswered` · `users` · `system` | the whole admin portal (all RBAC-guarded) |

### 4.3 Auth & security
- **Passwords**: Argon2 (`pwdlib`) in `core/security.py`.
- **JWT**: HS256, 30-min access + 14-day refresh; claims carry `tenant_id`, `role`, `guest`, `sid`.
- **RBAC**: `core/rbac.py` maps role → allowed scopes (owner / admin / editor / viewer); role is resolved live from the DB row, so deactivation/role changes apply immediately.
- **Guests**: anonymous visitors get viewer-scoped, rate-limited tokens via `POST /v1/auth/guest`; per-IP rate limit + hard `GUEST_MESSAGE_LIMIT` cap (`core/guest_limits.py`), enforced before any LLM work.
- **Tenant isolation**: every query is filtered by `tenant_id`; cross-tenant access returns 404 (not 403) to avoid leaking existence.

### 4.4 Agent loop — `services/orchestrator.py`
- `stream_reply(...)` runs the LLM tool loop:
  - Takes the user message, grounds the system prompt with retrieved context, calls the LLM.
  - If the model requests a tool, the loop executes it (max `AGENT_MAX_TOOL_ITERATIONS` = 5) and feeds results back.
  - Streams typed events to the client: `text_delta`, `tool_call_started`, `tool_call_completed`, `message_done` (with citations).
- The shipped tool is `search_knowledge_base` (`services/tools/`) — hybrid retrieval over the tenant's chunks.

### 4.5 RAG — `services/rag.py`
- **Chunking**: token-aware via `tiktoken` (`cl100k_base`), target ~500 tokens with ~50-token overlap; char-based fallback if tiktoken is missing.
- **Retrieval**: single SQL query blending
  - lexical `ts_rank_cd(tsv, websearch_to_tsquery(...))` weighted 0.3, and
  - pgvector cosine similarity weighted 0.7
  against `document_chunks` **for that tenant only**, `RETRIEVAL_TOP_K` = 5.
- `tsv` is a generated column (migration `0002_lexical_tsv.py`), GIN-indexed.
- **Embeddings**: OpenAI-compatible endpoint (`text-embedding-3-small`, 1536-d). A `LocalHash` fallback exists for dev/tests; real ingestion/retrieval refuses to run on it (ADR-007).

### 4.6 Knowledge store — `services/knowledge.py`
- Parses `.pdf/.docx/.xlsx/.pptx/.md` from `documents/` and crawls `KNOWLEDGE_SITES` (e.g. `https://www.tryvium.ai/`, max 80 pages) into `document_chunks`.
- Runs at startup and on a `KNOWLEDGE_REFRESH_MINUTES` loop.

### 4.7 Portal service — `services/portal.py` (774 lines)
The whole admin backend: document upload/edit/versions/retrain, site crawl, analytics queries, unanswered questions, users/roles/invitations, settings, audit log, backup/restore, notifications.

### 4.8 Data model (`db/models.py` + `db/admin_models.py`, see `database/erd.md`)
- **Core**: `tenants`, `users`, `conversations`, `messages`, `documents`, `document_chunks` (with `embedding vector(1536)` + generated `tsv`).
- **Admin**: `admin_settings`, audit logs, backups, notifications, users/roles extensions.

---

## 5. Frontend in Detail

### 5.1 Admin Portal — `admin-ai.html`
- **Zero-build**: a single static HTML file with inline CSS + vanilla JS. No bundler, no framework, no npm.
- **Design**: CSS custom properties, dark/light theme, Inter font, sidebar layout, brand “TryMe”.
- **Consumes only** `/v1/admin/*` (analytics, knowledge, users, system, unanswered).
- **Auth flow**: login form → stores access + refresh tokens (localStorage) → auto-refresh on expiry → logout clears tokens.
- Reads the API base from `api-config.js` → `window.APP_API_BASE` (deployed via GitHub Pages).

### 5.2 Chat UI — `index.html` (text) and `main.html` (voice)
- Same pattern: static HTML, vanilla JS, design tokens in CSS variables, Inter font, glass/dark aesthetic.
- Chat flow:
  1. Anonymous `POST /v1/auth/guest` → viewer token pair (no credentials on disk).
  2. `ensureSession()` restores tokens / creates a conversation / refreshes when expired.
  3. Streams replies over **SSE** (`/v1/conversations/{id}/messages`) rendering `text_delta`, tool indicators, citations.
  4. Past the guest limit, prompts email+password login (`/v1/auth/login`) to save the conversation.
- `main.html` adds the Web Speech API for voice input/output.

### 5.3 Embeddable Widget — `frontend/` (React + Vite)
- **Build**: Vite 5 **library mode** → one self-contained ES module `dist/agent-widget.js` (+ auto-emitted `style.css`). React/React-DOM externalized (host app provides them).
- **Entry** `src/main.jsx`: defines the custom element `<ai-agent-widget>` with attributes `api-base`, `token`, `tenant-id`; React renders inside **Shadow DOM** so host CSS cannot leak in.
- **Auth contract**: tokens live in memory only; when missing/expired the widget dispatches a composed `auth_needed` event (bubbles to the host page, which supplies a token).
- **Components/libs**:
  - `ChatWidget.jsx` — message list, streaming state, login form, tool/citation display.
  - `lib/api.js` — `fetch` wrapper (`ApiError`), `login`, `refresh`, `createConversation`, `fetchHistory`.
  - `lib/auth.js` — in-memory token store.
  - `lib/stream.js` — SSE + WebSocket stream clients (WS used when available, token passed via query param since WebSocket can't set headers).
- **Embed**: one script tag + `<ai-agent-widget api-base="https://…"></ai-agent-widget>`.

---

## 6. End-to-End Data Flow (chat)

```
User types message
  → ensureSession(): guest token or login tokens (JWT access 30m / refresh 14d)
  → POST /v1/conversations                (tenant-scoped row created)
  → POST /v1/conversations/{id}/messages  → SSE stream
       orchestrator.stream_reply:
         - retrieve top-k chunks (hybrid ts_rank + vector cosine, tenant-filtered)
         - LLM call → tool loop (search_knowledge_base) → final answer
       events: text_delta → tool_call_started/completed → message_done(+citations)
  → messages persisted to Postgres
  → guest path rate-limited + capped at GUEST_MESSAGE_LIMIT
```

---

## 7. Configuration Cheat-Sheet (`.env.example`)

| Key | Default | Purpose |
|-----|---------|---------|
| `DATABASE_URL` | `postgresql+asyncpg://…` | Postgres + pgvector DSN |
| `LLM_PROVIDER` | `groq` | `groq` (OpenAI-format) or `anthropic` |
| `GROQ_API_KEY` / `GROQ_MODEL` | `llama-3.3-70b-versatile` | Groq LLM |
| `ANTHROPIC_API_KEY` / `ANTHROPIC_MODEL` | `claude-sonnet-4-5` | Anthropic LLM |
| `EMBEDDINGS_API_KEY` / `EMBEDDINGS_MODEL` | `text-embedding-3-small` | embeddings (1536-d) |
| `JWT_SECRET` | — | 32+ char random |
| `RETRIEVAL_TOP_K` · weights | 5 · 0.3/0.7 | hybrid retrieval tuning |
| `KNOWLEDGE_SITES` | `https://www.tryvium.ai/` | site crawl targets |
| `GUEST_MESSAGE_LIMIT` | 10 | anonymous chat cap |
| `AGENT_MAX_TOOL_ITERATIONS` | 5 | tool-loop guardrail |
| `BOOTSTRAP_OWNER_EMAIL/PASSWORD` | — | first admin (seeded via `cli.py seed`) |

---

## 8. How to Run / Deploy

- **Local**: `docker compose up -d postgres` → `pip install -e "backend[dev]"` → `alembic upgrade head` → `python -m backend.cli seed` → `uvicorn backend.main:app --reload --port 8000`.
- **All in Docker**: `docker compose up -d --build`.
- **Cloud (Render)**: repo-root `render.yaml` Blueprint provisions Postgres + backend web service + keep-alive cron; migrations + seed run automatically on boot.
- **Widget**: `cd frontend && npm install && npm run build` → `dist/agent-widget.js`.
- **Frontends on GitHub Pages**: set the backend URL in `api-config.js` (`window.APP_API_BASE`) and re-push.
