# Enterprise AI Agent

A production AI agent platform: FastAPI backend with an LLM tool loop and retrieval-augmented
generation, a LangGraph supervisor that routes each request to a specialist agent, a Postgres
`pgvector` vector store, JWT auth with role-based access, streaming responses over SSE and
WebSocket, an admin portal and an embeddable chat widget.

Answers are grounded in an indexed knowledge base and cite their source. When retrieval does not
return enough confidence, the agent says it could not find a reliable answer instead of guessing.

## The problem

Most AI chat demos are a prompt plus a vector database. The hard parts show up once real users
and real documents arrive:

- **Stale answers.** Documents change. Without incremental re-indexing, the bot confidently
  answers from last quarter's pricing page.
- **Untraceable answers.** A plausible-sounding answer with no source is worse than no answer,
  because nobody can check it.
- **Routing.** One general assistant handles billing questions and technical questions equally
  badly. Specialists answer their own domain properly.
- **Operational cost.** Naive RAG runs several model calls per message whether or not the
  question needs them.

This platform addresses each of those: content-hash based incremental ingest, mandatory citations,
a supervisor that routes to domain specialists, and observability on every routing decision.

## Architecture

```
                        ┌───────────────────────────────┐
   Browser / Widget ───▶│  FastAPI  (SSE + WebSocket)    │
                        │  JWT auth · RBAC · rate limits │
                        └───────────────┬───────────────┘
                                        │
                        ┌───────────────▼───────────────┐
                        │       Orchestrator            │
                        │   decides single-agent vs.     │
                        │   multi-agent for this turn    │
                        └───────┬───────────────┬───────┘
                                │               │
              ┌─────────────────▼──┐      ┌─────▼──────────────────────┐
              │  Single-agent loop │      │  LangGraph StateGraph       │
              │  LLM tool call     │      │  supervisor                │
              │  → RAG tool        │      │    ├─ knowledge specialist  │
              │  → cited answer    │      │    ├─ support specialist    │
              └─────────┬──────────┘      │    └─ sales specialist     │
                        │                 └─────┬──────────────────────┘
                        └───────────┬─────────────┘
                                    │
                        ┌───────────▼───────────────┐
                        │   search_knowledge_base   │
                        │   hybrid retrieval:       │
                        │   ts_rank + pgvector      │
                        └───────────┬───────────────┘
                                    │
        ┌───────────────────────────▼───────────────────────────┐
        │        PostgreSQL 16  —  one database, two jobs       │
        │   relational tables (tenants, users, conversations)   │
        │   + `document_chunks.embedding` as pgvector(1024)     │
        └───────────────────────────────────────────────────────┘

   Admin SPA ──▶ knowledge base management, versions, ingest,
                 analytics, audit log, backup/restore, settings
```

Both retrieval paths run against the same tenant-scoped table. Keyword search uses Postgres
full-text ranking; vector search uses cosine distance over `pgvector`. Embeddings come from
Ollama locally or any OpenAI-compatible endpoint.

## Tech stack

| Layer | Technology |
| --- | --- |
| API | FastAPI, SQLAlchemy (async), Alembic, Uvicorn |
| Agent routing | LangGraph `StateGraph` supervisor + specialist workers |
| Retrieval | pgvector cosine, Postgres full-text `ts_rank`, hybrid weighting |
| LLM | Groq or Anthropic; Ollama and OpenAI-compatible providers supported |
| Embeddings | Ollama local, or any OpenAI-compatible embeddings endpoint |
| Auth | JWT access + refresh, Argon2 password hashing, owner/admin/editor/viewer roles |
| Streaming | Server-Sent Events and WebSocket |
| Frontend | Vanilla HTML/JS admin portal and chat UI; React + Vite Web Component widget |
| Database | PostgreSQL 16 with the `vector` extension |
| Infra | Docker, Docker Compose, Render blueprint, Helm chart, Terraform |

## Running it

```bash
git clone https://github.com/jeevithkumarjt/ai-agent.git
cd ai-agent/agent-ai/enterprise-ai-agent

cp .env.example .env
# Set DATABASE_URL, JWT_SECRET (32+ random chars),
# GROQ_API_KEY or ANTHROPIC_API_KEY, and EMBEDDINGS_API_KEY.

docker compose up -d --build
```

That brings up Postgres with `pgvector` and the API. Migrations and the owner account are
applied automatically on boot.

| Service | URL |
| --- | --- |
| API | http://localhost:8000 |
| API docs | http://localhost:8000/docs |
| Admin portal | open `admin-ai.html` |
| Chat UI | open `index.html` |

Then load some knowledge:

```bash
python -m backend.cli ingest --path ./documents
```

Run it without Docker if you prefer — bring your own Postgres, `pip install -e "backend[dev]"`,
`alembic upgrade head`, then `uvicorn backend.main:app --reload`.

### Embeddable widget

```bash
cd frontend && npm install && npm run build   # → dist/agent-widget.js
```

```html
<script type="module" src="/agent-widget.js"></script>
<ai-agent-widget api-base="http://localhost:8000"></ai-agent-widget>
```

## Configuration

Every key is documented in `.env.example`. The ones that matter:

| Key | Purpose |
| --- | --- |
| `DATABASE_URL` | Postgres DSN |
| `LLM_PROVIDER` | `groq` or `anthropic` |
| `GROQ_API_KEY` | Groq key (`gsk_...`) |
| `ANTHROPIC_API_KEY` | Anthropic key (`sk-ant-...`) |
| `EMBEDDINGS_API_KEY` | OpenAI-compatible embeddings key. Unset disables retrieval |
| `JWT_SECRET` | 32+ character random string |
| `KNOWLEDGE_SITES` | Comma-separated URLs to crawl into the knowledge base |

## Security

- Secrets come from the environment only. No `.env` file is committed, and `.env.example` holds
  placeholders rather than working credentials.
- Passwords are stored as Argon2 hashes.
- JWT access tokens last 30 minutes, refresh tokens 14 days. Both carry `tenant_id` and `role`.
- Role changes and deactivation take effect immediately — roles resolve from the database, not
  from the token alone.
- Public chat visitors get a viewer-scoped token with per-IP and per-visitor rate limits. No
  admin credentials ever reach the browser.

## Current status

Working and containerised. Single-tenant in practice, multi-tenant-ready in the schema. The
knowledge base ingests uploaded documents and crawls configured sites.

Not done: the `render.yaml` blueprint uses free-tier plans, which spin down after inactivity and
delete the database after 30 days. That configuration is for demos and debugging only — raise the
service and database plans before putting real customers on it.

## Documentation

- `01-architecture-decisions.md` — why each major decision went the way it did
- `02-agent-and-rag-workflow.md` — the request path through the agent
- `03-data-model.md` — schema and relationships
- `04-api-contract.md` — endpoint reference
- `05-roadmap.md` — what is planned
- `api/openapi.yaml` — machine-readable API contract

## License

Proprietary. All rights reserved.