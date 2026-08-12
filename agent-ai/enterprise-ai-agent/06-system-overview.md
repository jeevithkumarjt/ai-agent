# Enterprise AI Agent — System Overview

A practical map of the whole system: what it is, how the pieces fit together, what each file does, and what we changed in this session.

---

## 1. What we did this session (docx knowledge sync)

**Problem:** The 14 Word documents in `documents/doc/` (Tryvium website pages: Home, About Us, AWS, GCP, Azure, Privacy Policy, etc.) were **not being synced** into the knowledge base, so the chat agent had no grounding on them.

**Root causes (two independent blockers):**

| # | Where | Issue |
|---|-------|-------|
| 1 | `backend/cli.py` | `SUPPORTED_SUFFIXES` only allowed `.md .markdown .txt .rst .html` → the ingest CLI skipped `.docx` (and pdf/csv/json/xlsx/pptx) entirely. |
| 2 | `backend/services/knowledge.py` | docx extraction (`_extract_text`) needs `python-docx`, which was **not installed** → every docx was skipped with a `knowledge_skip_docx` warning. |

**Fixes applied:**

1. Expanded `SUPPORTED_SUFFIXES` in `backend/cli.py` to cover every type the extractor can parse:
   `.md .markdown .txt .rst .text .log .html .htm .xml .csv .json .pdf .docx .xlsx .pptx`
2. Installed `python-docx` (already a declared dependency in `backend/pyproject.toml`, so the Docker image on Render gets it automatically).

**Verification (done, not just claimed):**

- All **14 docx files** extract text successfully (`_extract_text`) → 14 sources indexed, 33 chunks.
- Retrieval returns valid hits, e.g.:
  - "Tell me about GCP" → hits `GCP page.docx`
  - "What is EOP?" → hits `EOP.docx`
  - "What does Tryvium offer on AWS?" → hits `AWS`/`EOP` docs

**Still required to go live on Render:** commit + push `cli.py`, trigger **Manual Deploy** in Render, then press **Sync** in the admin portal.

---

## 2. High-level architecture

```
┌────────────────────────────── GitHub Pages (static) ─────────────────────────────┐
│   admin-ai.html (Admin SPA)     index.html / main.html (Chat UI)                 │
│   frontend/ (React embeddable widget)                                            │
│   api-config.js  → window.APP_API_BASE  = https://ai-agent-backend-wnc6.onrender.com
│   no credentials in static files → guest session via POST /v1/auth/guest       │
└──────────────────────────────────┬───────────────────────────────────────────────┘
                                   │ HTTPS (REST + SSE / WebSocket)
┌──────────────────────────────────▼───────────────────────────────────────────────┐
│              FastAPI backend  (Render — ai-agent-backend)                        │
│   api/          routes (auth, conversations, knowledge, health, admin/*)         │
│   core/         settings, security, rbac, LLM clients, embeddings, rate limit    │
│   services/     orchestrator (agent loop), rag, knowledge store, portal          │
│   db/           SQLAlchemy models + async session                                 │
│   alembic/      migrations (schema.sql → 0001)                                   │
└──────────────────────────────────┬───────────────────────────────────────────────┘
                                   │
                 ┌─────────────────┴──────────────────┐
                 │  PostgreSQL 16 + pgvector          │
                 │  (one DB = relational + vector)    │
                 └────────────────────────────────────┘
```

**Three layers:**

1. **Frontend (GitHub Pages)** — static HTML/JS pages. No build needed except the optional React widget.
2. **Backend (Render, Docker)** — FastAPI service that owns auth, the agent tool loop, RAG retrieval, and the admin portal APIs.
3. **Database (Render Postgres)** — one Postgres instance doubles as the vector store via the `pgvector` extension.

---

## 3. Repository layout

```
agent-ai/enterprise-ai-agent/
├── backend/                  # FastAPI app (Python 3.12)
│   ├── api/                  #   HTTP routes
│   ├── core/                 #   config, security, rbac, LLM + embedding clients
│   ├── db/                   #   ORM models + async session
│   ├── services/             #   orchestrator, rag, knowledge store, portal, tools
│   ├── alembic/              #   DB migrations
│   ├── cli.py                #   seed + ingest commands
│   ├── main.py               #   app factory + startup loops
│   ├── pyproject.toml        #   dependencies
│   └── Dockerfile            #   container image
├── frontend/                 # React + Vite embeddable chat widget (Web Component)
├── documents/                # knowledge sources (doc/, pdf/, md/, csv/, ...)
├── database/                 # schema.sql + erd.md
├── api/openapi.yaml          # API contract (source of truth for wire format)
├── admin-ai.html             # admin portal SPA
├── index.html                # chat UI — "TryMe AI — Enterprise Assistant"
├── main.html                 # chat UI — "TryMe AI — Talk to Your Enterprise AI"
├── api-config.js             # window.APP_API_BASE (Pages → backend URL)
├── docker-compose.yml        # postgres + backend (local dev)
├── .env.example              # documented config keys
└── 0x-*.md                   # design docs: architecture, agent/RAG, data model, API, roadmap
```

---

## 4. Backend structure (FastAPI)

### 4.1 Entry points

| File | Purpose |
|------|---------|
| `main.py` | App factory. Wires CORS, middleware, routers, and app services (`app.state.orchestrator`, `app.state.portal`, `app.state.knowledge`). Runs two background loops: knowledge refresh (startup + every `KNOWLEDGE_REFRESH_MINUTES`) and auto-sync. |
| `cli.py` | `python -m backend.cli seed` → bootstrap tenant + owner; `python -m backend.cli ingest --path <file|dir>` → embed + store chunks. **Now supports docx/pdf/csv/json/xlsx/pptx/etc.** |

### 4.2 Routes (API)

**Public API — prefix `/v1`**

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/v1/auth/login` | Login → `access_token` + `refresh_token` |
| POST | `/v1/auth/refresh` | Rotate token pair (30 min access / 14 day refresh) |
| POST | `/v1/auth/guest` | Anonymous start-session → viewer-scoped, rate-limited token pair |
| POST | `/v1/conversations` | Create a conversation |
| GET | `/v1/conversations/{id}/messages` | Conversation history (paginated) |
| POST | `/v1/conversations/{id}/messages` | Send a message → **SSE stream** of agent events |
| WS | `/v1/conversations/{id}/ws` | Same agent stream over WebSocket |
| GET | `/v1/knowledge/status` | Knowledge base status (sources/chunks) |
| GET | `/v1/health` | Health check (DB, KB, LLM, embeddings, storage) |

**SSE event set (locked):** `user_message | text_delta | tool_call_started | tool_call_completed | message_done | error`

**Admin API — prefix `/v1/admin`** (all tenant-scoped + RBAC-scoped)

| Group | Endpoints |
|-------|-----------|
| `/knowledge` | GET list/status/jobs, GET `/{id}` + `/versions`, POST edit/delete/rollback/manual/upload/retrain/sync |
| `/unanswered` | GET list, POST `/{id}/answer` |
| (analytics) | GET `/overview`, `/analytics/trends`, `/analytics/top-queries`, `/analytics/funnel`, `/analytics/distribution`, `/analytics/document-usage`, `/conversations`, `/conversations/{id}`, `/feedback` |
| `/users` | GET list, POST `/invite`, PATCH `/{id}`, GET `/activity` |
| (system) | GET `/me`, `/health`, `/audit`, `/notifications`, POST `/notifications/read`, GET+PUT `/settings`, GET+POST `/api-keys`, DELETE `/api-keys/{index}`, GET `/backup`, POST `/backup/restore`, GET `/export-conversations`, GET `/jobs` |

### 4.3 Services (the brains)

| Service | File | Role |
|---------|------|------|
| **Orchestrator** | `services/orchestrator.py` | Owns the agent tool loop. Streams LLM turns, executes tools, persists messages. Prepends retrieved knowledge to the system prompt (`_system_with_context`). Contains the full "TryMe Assistant" system prompt. |
| **KnowledgeStore** | `services/knowledge.py` | **Lexical (BM25), in-memory, stdlib-only** index over `documents/` + crawled site. Rebuilt on refresh. This is what actually grounds chat answers. `_extract_text` handles txt/md/csv/json/html/pdf/**docx**/xlsx/pptx. |
| **RagService** | `services/rag.py` | Vector RAG (pgvector, cosine similarity) used by the `search_knowledge_base` tool. Token-aware chunking (~500 tok, ~50 overlap). |
| **PortalService** | `services/portal.py` | Admin portal logic: document lifecycle (upload/edit/version/rollback), settings, analytics ingestion, audit, notifications, train jobs, API keys, backup/restore. Background jobs for upload/retrain/sync. |

### 4.4 Core modules

| File | Role |
|------|------|
| `core/settings.py` | Central config (pydantic-settings, loaded from `.env`). All env keys documented in `.env.example`. |
| `core/security.py` | Argon2 password hashing. |
| `core/auth.py` | JWT encode/decode (HS256, access + refresh claims). |
| `core/rbac.py` | Role → scope matrix. Roles: `owner` (Super Admin), `admin`, `editor` (Trainer), `viewer`. |
| `core/anthropic_client.py` | Anthropic Messages API streaming client (custom, no SDK). |
| `core/openai_compat_client.py` | OpenAI-compatible adapter (used for Groq). |
| `core/embeddings.py` | Embeddings client (OpenAI-compatible); hash fallback is dev-only and cannot feed ingestion/retrieval. |
| `core/rate_limit.py` | Rate-limit middleware seam. |

### 4.5 Database (Postgres + pgvector)

**Core tables** (`db/models.py`, alembic-managed):

| Table | Purpose |
|-------|---------|
| `tenants` | Tenant rows (multi-tenant by design, ADR-004). |
| `users` | Users with role (`owner/admin/editor/viewer`), Argon2 password hash. |
| `conversations` | Chat threads. |
| `messages` | user/assistant/tool messages; `tool_calls` JSONB mirror. |
| `document_chunks` | RAG chunks with `embedding vector(1536)`. |
| `tool_calls` | Audit of every tool invocation. |

**Admin tables** (`db/admin_models.py`, created at startup via `create_all`):

| Table | Purpose |
|-------|---------|
| `admin_documents` / `admin_document_versions` | Knowledge documents + version history (checksum, status draft/indexed/error). |
| `unanswered_questions` | Low-confidence/unanswered questions surfaced to admins. |
| `answer_metrics` | Per-answer confidence, response time, tool calls. |
| `audit_logs` | Every admin action. |
| `notifications` | Portal notifications. |
| `admin_settings` | Per-tenant settings (retrieval_top_k, auto_sync_minutes, api_keys, ...). |
| `train_jobs` | Background ingest/retrain/sync progress. |
| `message_feedback` | Thumbs up/down ratings + comments. |

---

## 5. Frontend structure

### 5.1 Static pages (GitHub Pages)

| File | Title | Purpose |
|------|-------|---------|
| `admin-ai.html` | TryMe Enterprise AI — Admin Portal | Full SPA: knowledge manager, chat analytics, unanswered questions, users, audit, settings, backup. Talks only to `/v1/admin/*`. |
| `index.html` | TryMe AI — Enterprise Assistant | Chat UI (end-user). |
| `main.html` | TryMe AI — Talk to Your Enterprise AI | Chat UI (end-user). |

**Config glue:**

- `api-config.js` → `window.APP_API_BASE = "https://ai-agent-backend-wnc6.onrender.com"` — points the static pages at the backend.
- No credentials are shipped in static files. Chat visitors get a viewer-scoped token from `POST /v1/auth/guest`.

**Auth flow in chat pages:** `POST /v1/auth/guest` → rate-limited viewer token → `ensureSession()` restores/refreshes → chat creates a conversation → streams via SSE. Real users sign in with `POST /v1/auth/login` to save conversations past the guest message cap. The admin SPA logs in normally with email + password.

### 5.2 Embeddable widget (`frontend/`, React + Vite)

```
frontend/
├── src/
│   ├── main.jsx                 # custom element <ai-agent-widget>
│   ├── components/ChatWidget.jsx
│   ├── components/styles.css
│   └── lib/
│       ├── api.js               # REST client (login, refresh, conversations)
│       ├── auth.js              # token storage/refresh
│       └── stream.js            # SSE reader
├── index.html                   # dev playground
├── package.json
└── vite.config.js               # library mode → dist/agent-widget.js
```

Embed anywhere with two tags:

```html
<script type="module" src="/agent-widget.js"></script>
<ai-agent-widget api-base="http://localhost:8000"></ai-agent-widget>
```

---

## 6. Chat request lifecycle (end to end)

```
1. User types a message in index.html / main.html / widget
2. Frontend: POST /v1/conversations/{id}/messages   (SSE)
3. Orchestrator.stream_reply():
   a. persist user message
   b. load + reconstruct history (Anthropic wire format)
   c. KnowledgeStore.search(query) → top-k chunks  (BM25 over documents/ + site)
   d. build system prompt + "# Retrieved knowledge for this question"
   e. stream LLM turn (text_delta events)
   f. if tool_use requested → execute search_knowledge_base tool (vector RAG)
      → feed tool_result back, loop (max AGENT_MAX_TOOL_ITERATIONS)
   g. persist assistant turn
   h. record metrics (confidence, unanswered detection)
4. Frontend renders text_delta events as they arrive
```

**Two retrieval paths:**

| Path | Store | When used |
|------|-------|-----------|
| Lexical BM25 | `KnowledgeStore` (in-memory, `documents/` + site) | Always — prepended to the system prompt. **This is where docx content lands.** |
| Vector (pgvector) | `RagService` → `document_chunks` | Inside the `search_knowledge_base` tool (DB-backed, tenant-scoped). |

---

## 7. Knowledge base — how to sync/ingest

| Method | What it does | Docx support |
|--------|--------------|--------------|
| **Startup** | `_knowledge_refresh_loop` scans `documents/` + crawls sites automatically | ✅ (now) |
| **Admin portal → Sync** | `portal.sync_sites` → `knowledge.refresh()` | ✅ (now) |
| **Admin portal → Upload / Retrain** | `_ingest_batch_job` / `_rebuild_job` — extracts text, indexes DB chunks | ✅ |
| **CLI** `python -m backend.cli ingest --path ./documents` | Embeds + stores DB chunks | ✅ (now, after the `SUPPORTED_SUFFIXES` fix) |

Supported file types (extractor + CLI now agree): `.txt .md .markdown .rst .text .log .html .htm .xml .csv .json .pdf .docx .xlsx .pptx`

`.env` knobs: `KNOWLEDGE_DOCS_DIR` (default `documents`), `KNOWLEDGE_SITES` (crawl list), `KNOWLEDGE_MAX_SITE_PAGES`, `KNOWLEDGE_REFRESH_MINUTES`, `RETRIEVAL_TOP_K`.

---

## 8. Deployment

- **Render Blueprint** (`render.yaml` at repo root): provisions `ai-agent-db` (Postgres, pgvector) + `ai-agent-backend` (Docker, free tier). Backend runs `alembic upgrade head && seed` then serves on :8000.
- **Docker** (`backend/Dockerfile`): copies `backend/` + `documents/`; `pip install ./backend` installs **python-docx**, pypdf, openpyxl, python-pptx (so docx works out of the box in the image).
- **GitHub Pages**: static pages at `jeevithkumarjt.github.io/ai-agent/agent-ai/enterprise-ai-agent/...`, wired to the backend via `api-config.js`.

---

## 9. Security notes

- Secrets are env-only; `.env` and key files are gitignored. Static files carry **no credentials**: public chat pages start a session via `POST /v1/auth/guest` (viewer role, rate-limited per IP + per-visitor message cap).
- Passwords hashed with Argon2; JWT access 30 min + refresh 14 days; RBAC enforced per admin route with scopes resolved from the DB row on every request.
- ⚠️ `.env` contains a live Groq API key locally. It is gitignored — do not commit it.

---

## 10. Suggested next steps

1. Commit + push the `cli.py` fix, then **Manual Deploy** on Render and press **Sync** in the admin portal → docx pages go live.
2. Set `EMBEDDINGS_API_KEY` to a real OpenAI-compatible embeddings endpoint (OpenAI `text-embedding-3-small`) and re-ingest, so vector retrieval is meaningful.
3. Rotate the old `BOOTSTRAP_OWNER_PASSWORD` / any account that was previously used by `api-credentials.js` (its plaintext file has been removed).
4. Add tests for the docx extraction path (now that `python-docx` is required, CI should install `backend[dev]`).
