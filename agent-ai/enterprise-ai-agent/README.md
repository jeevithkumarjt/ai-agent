# Enterprise AI Agent

A single-tenant-today, multi-tenant-ready AI agent platform. Local-first development, deployable
later without a rebuild. One relational database doubles as the vector store (Postgres + pgvector).
One backend process owns orchestration, RAG, and tool execution. The frontend ships as an
embeddable, framework-agnostic Web Component widget from day one.

> **Status: Locked.** `01-architecture-decisions.md` is the single source of truth. No component
> gets added, swapped, or "just tried quickly" without updating that document first.

## Layout

```
enterprise-ai-agent/
├── README.md
├── 01-architecture-decisions.md
├── 02-agent-and-rag-workflow.md
├── 03-data-model.md
├── 04-api-contract.md
├── 05-roadmap.md
├── docker-compose.yml            # local dev: pgvector + backend (see 01-architecture-decisions.md §7)
├── frontend/                     # Web Component widget (React internal, Vite library mode)
├── backend/                      # FastAPI app, custom tool loop, RAG
├── database/                     # schema.sql + erd.md
└── api/openapi.yaml              # API contract — source of truth for the wire format
```

## Quick start (local dev)

```bash
cp .env.example .env      # fill ANTHROPIC_API_KEY + EMBEDDINGS_API_KEY / JWT_SECRET
docker compose up -d postgres
pip install -e "backend[dev]"
alembic -c backend/alembic.ini upgrade head     # apply schema.sql via the initial migration
python -m backend.cli seed                      # bootstrap tenant + owner user
python -m backend.cli ingest --path ./kb_src    # offline batch ingestion
uvicorn backend.main:app --reload --port 8000
```

Frontend widget dev:

```bash
cd frontend && npm install && npm run dev
# production bundle: npm run build  →  dist/agent-widget.js
```

Embed with one script tag and one custom element:

```html
<script type="module" src="/agent-widget.js"></script>
<ai-agent-widget tenant-id="..." api-base="https://api.example.com" token="..."></ai-agent-widget>
```

## Why this is lean

Every architecture decision is recorded in `01-architecture-decisions.md`. The headline choices:
Postgres + pgvector only (ADR-001), a hand-written Anthropic `tool_use` loop instead of a
framework (ADR-002), a Web Component widget built with React + Vite (ADR-003), and tenant scoping
from day one (ADR-004).

## License

Proprietary.
