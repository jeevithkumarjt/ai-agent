# Enterprise AI Agent

A production-ready, multi-tenant-ready AI agent platform: FastAPI backend with a custom
LLM tool loop + RAG, Postgres/pgvector vector store, JWT auth with role-based access
(owner / admin / editor / viewer), a full admin portal SPA, and an embeddable chat widget.

- **Backend** — FastAPI, SQLAlchemy (async), Alembic, JWT + RBAC, SSE streaming chat,
  knowledge base management (upload / edit / versions / retrain / site crawl), analytics,
  audit log, backup/restore, notifications, settings. Works with **Anthropic** or **Groq**
  (OpenAI-compatible) LLMs and any OpenAI-compatible embeddings endpoint.
- **Frontends** — `admin-ai.html` (admin SPA), `index.html` / `main.html` (chat UI),
  plus `frontend/` (React + Vite embeddable Web Component widget).
- **Database** — one Postgres instance doubles as the vector store via pgvector.

## Repository layout

```
enterprise-ai-agent/
├── backend/                # FastAPI app, custom tool loop, RAG
│   ├── api/                #   auth, conversations, knowledge, health, admin/* (RBAC)
│   ├── core/               #   settings, rbac, security, llm clients, embeddings
│   ├── db/                 #   SQLAlchemy models + async session
│   ├── services/           #   rag, orchestrator, portal, knowledge, tools
│   ├── alembic/            #   migrations (schema.sql via 0001_initial_schema)
│   ├── cli.py              #   seed + ingest commands
│   └── Dockerfile          #   container image
├── frontend/               # Web Component chat widget (React + Vite, library mode)
├── documents/              # knowledge base sources (docs + site crawl)
├── database/               # schema.sql + erd.md
├── api/openapi.yaml        # API contract — source of truth for the wire format
├── admin-ai.html           # admin portal SPA
├── index.html / main.html  # chat UI (standalone)
├── api-config.js           # window.APP_API_BASE (Pages/backend URL)
├── api-credentials.example.js  # copy to api-credentials.js (gitignored) — chat auto-login
├── docker-compose.yml      # postgres + backend
└── .env.example            # every configuration key, documented
```

## Prerequisites

- Python 3.12+
- PostgreSQL 16 with the `vector` extension (the `docker compose up -d postgres` step
  handles this), or Docker Engine
- Node.js 18+ (only if you build the React widget)

## Quick start (local, no Docker required)

```bash
# 1. Configure environment
cp .env.example .env
#    Fill in: ANTHROPIC_API_KEY (Groq: gsk_..., or Anthropic: sk-ant-...),
#             JWT_SECRET (32+ random chars), and optionally EMBEDDINGS_API_KEY.

# 2. Start the database (Postgres 16 + pgvector)
docker compose up -d postgres

# 3. Install the backend (editable, dev extras)
pip install -e "backend[dev]"

# 4. Apply the schema
alembic -c backend/alembic.ini upgrade head

# 5. Bootstrap the tenant + owner user (uses BOOTSTRAP_OWNER_* from .env)
python -m backend.cli seed

# 6. (Optional) ingest a knowledge source file/directory
python -m backend.cli ingest --path ./documents

# 7. Run the API (also auto-refreshes knowledge from documents/ + site crawl at startup)
uvicorn backend.main:app --reload --port 8000
```

Open the admin portal and chat UI (they call `http://127.0.0.1:8000` by default):

- Admin portal: open `admin-ai.html` in a browser, log in with `BOOTSTRAP_OWNER_EMAIL` /
  `BOOTSTRAP_OWNER_PASSWORD`.
- Chat UI: open `index.html` (or `main.html`).
- API docs: http://localhost:8000/docs

### Frontend widget (optional)

```bash
cd frontend && npm install && npm run build   # → dist/agent-widget.js
```

Embed with one script tag and one custom element:

```html
<script type="module" src="/agent-widget.js"></script>
<ai-agent-widget api-base="http://localhost:8000"></ai-agent-widget>
```

## Run everything with Docker

```bash
cp .env.example .env   # fill ANTHROPIC_API_KEY and JWT_SECRET
docker compose up -d --build
```

The backend container applies migrations and seeds the owner automatically, then serves
the API at http://localhost:8000 (docs at `/docs`).

## Deployment (cloud server)

The repo is container-ready. On any host with Docker:

```bash
git clone https://github.com/jeevithkumarjt/ai-agent.git
cd agent-ai/enterprise-ai-agent
cp .env.example .env          # set DATABASE_URL + secrets for your Postgres/pgvector
docker compose up -d --build
```

Or build just the backend image:

```bash
docker build -f backend/Dockerfile -t agentai-backend .
docker run --env-file .env -p 8000:8000 agentai-backend
```

## Deploy to Render (free tier)

The repo root contains a `render.yaml` Blueprint that provisions the backend
web service and a managed Postgres (pgvector included) with one click.

1. Push the repo to GitHub, then open https://render.com → **New** → **Blueprint**.
2. Connect the `jeevithkumarjt/ai-agent` repo. Render reads `render.yaml`,
   creates `ai-agent-db` (Postgres) and `ai-agent-backend` (web service).
3. After the first deploy, open the `ai-agent-backend` service → **Environment**
   and set the values marked `sync: false`:
   - `ANTHROPIC_API_KEY` — Groq key (`gsk_…`) for the LLM
   - `EMBEDDINGS_API_KEY` — OpenAI-compatible embeddings key (empty = dev hash fallback)
   - `BOOTSTRAP_OWNER_EMAIL` / `BOOTSTRAP_OWNER_PASSWORD` — the admin login
4. Click **Manual Deploy → Deploy latest commit**. Render runs
   `alembic upgrade head` + `seed` automatically on every boot.
5. Note the service URL (e.g. `https://ai-agent-backend.onrender.com`) and set
   it in `agent-ai/enterprise-ai-agent/api-config.js`, then re-push to GitHub —
   the Pages frontends (admin + chat) will use it via `window.APP_API_BASE`.

Notes for production:

- Set `APP_ENV=production`, a strong `JWT_SECRET`, a real database, and a real
  embeddings endpoint (`EMBEDDINGS_API_KEY`) for meaningful retrieval.
- Change `BOOTSTRAP_OWNER_PASSWORD` immediately after first login.
- Terminate TLS at a reverse proxy / ingress (see `infra/` at the repo root for a Helm
  chart and Terraform).

## Configuration

Every key is documented in `.env.example`. The essential ones:

| Key | Purpose |
|-----|---------|
| `DATABASE_URL` | Postgres DSN (`postgresql+asyncpg://...`) |
| `LLM_PROVIDER` | `groq` (default) or `anthropic` |
| `ANTHROPIC_API_KEY` | Groq `gsk_...` or Anthropic `sk-ant-...` |
| `ANTHROPIC_BASE_URL` | `https://api.groq.com/openai/v1` (Groq) or `https://api.anthropic.com` |
| `ANTHROPIC_MODEL` | `llama-3.3-70b-versatile` (Groq) or `claude-sonnet-4-5` |
| `EMBEDDINGS_API_KEY` | OpenAI-compatible embeddings key (empty = dev hash fallback) |
| `JWT_SECRET` | 32+ char random string |
| `KNOWLEDGE_SITES` | comma-separated URLs to crawl into the knowledge base |

## Security

- Secrets are read from the environment only (never committed). The chat frontends'
  auto-login credentials live in `api-credentials.js`, which is gitignored
  (`api-credentials.example.js` is the committed template). If it is absent or empty,
  the chat shows a sign-in form instead.
- Passwords are stored as Argon2 hashes (`backend/core/security.py`).
- JWT access (30 min) + refresh (14 day) tokens carry `tenant_id` and `role` claims;
  refresh tokens renew the pair, so a logged-in session survives page reloads.
- RBAC enforced per admin route with scopes in `backend/core/rbac.py`; role changes and
  user deactivation take effect immediately (role is resolved from the DB row).
- Tokens rotate on a 30-minute access / 14-day refresh cycle.

## Frontend authentication flow

Both the admin SPA (`admin-ai.html`) and the chat pages (`index.html`, `main.html`) use
the same API:

1. `POST /v1/auth/login` returns `access_token` + `refresh_token`.
2. The page stores the pair in `localStorage` (`at` / `rt`).
3. On every load, `ensureSession()` restores the access token, creates a conversation,
   and transparently refreshes via `/v1/auth/refresh` when the access token expires.
4. If no valid session exists, the chat pages either auto-login with `api-credentials.js`
   (local dev convenience) or present a sign-in form.
5. The admin portal exposes a login form and a logout that clears stored tokens.

## Documentation

See `01-architecture-decisions.md`, `02-agent-and-rag-workflow.md`, `03-data-model.md`,
`04-api-contract.md`, `05-roadmap.md`, and the API contract in `api/openapi.yaml`.

## License

Proprietary.
