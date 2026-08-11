# Agent Orchestration & RAG Workflow

**Status: Locked.** Companion to `01-architecture-decisions.md`.

## 1. Agent orchestrator — the tool-calling loop

Plain, auditable loop. No hidden control flow. Lives in `backend/services/orchestrator.py`.

```
1. Load conversation history (scoped to tenant_id + conversation_id)
2. Call LLM with: system prompt + history + available tool schemas
3. If response contains tool_use blocks:
     a. For each tool_use, validate input against that tool's pydantic schema
     b. Execute tool (scoped to tenant_id)
     c. Append tool_result to conversation
     d. Go to step 2
4. If response is plain text: stream to client, persist to conversation history, done
```

### Guardrails baked into the loop, not bolted on after

- **Max 5 tool-call iterations per user message** — hard stop, prevents runaway loops.
- **Every tool call logged** — structured JSON: `tenant_id`, `tool_name`, `input`, `duration_ms`,
  `success`. Also persisted to the `tool_calls` table (audit log / debugging trace).
- **Tool execution wrapped in try/except** — a failing tool returns a structured error to the LLM,
  never crashes the request.
- Every turn is persisted to the `messages` table (role `user` / `assistant` / `tool`).

### Streaming

The orchestrator emits typed events through an async event sink so the API layer can forward them
over WebSocket (primary) or SSE (fallback), independent of transport:

`user_message` · `text_delta` · `tool_call_started` · `tool_call_completed` · `message_done` ·
`error`

## 2. RAG pipeline

### Ingestion (offline/batch, not part of the request path)

1. Source documents chunked (target ~500 tokens/chunk, 50-token overlap).
2. Each chunk embedded via the same embedding model used at query time.
3. Stored in `document_chunks`: `tenant_id, source_id, chunk_text, embedding vector(1536),
   metadata jsonb`.

Triggered by the CLI:

```bash
python -m backend.cli ingest --path ./kb_src --tenant <tenant-id>
```

### Retrieval (in the request path)

Retrieval is **itself a tool call** the LLM decides to invoke — not silent context-stuffing.

1. LLM emits `tool_use: search_knowledge_base` with a `query` argument.
2. Tool embeds the query with the same embedding model.
3. `SELECT ... FROM document_chunks WHERE tenant_id = :tid ORDER BY embedding <=> :q LIMIT :k`.
4. Top-k chunks are returned to the LLM as a `tool_result`; the LLM answers from them with
   citations in the text.

This keeps retrieval explicit and auditable.

### Chunking parameters

| Param | Value |
|---|---|
| Target chunk size | ~500 tokens |
| Overlap | 50 tokens |
| Retriever top-k | 5 (configurable via `RETRIEVAL_TOP_K`) |
| Similarity | cosine distance (`<=>`), flat scan under ~50k rows |

## 3. Tool router

Each tool is a self-contained module under `backend/services/tools/`:

```python
class Tool(Protocol):
    name: str
    description: str
    input_schema: type[BaseModel]
    output_schema: type[BaseModel]

    async def execute(self, *, tenant_id: uuid.UUID, **kwargs) -> BaseModel: ...
```

Phase 1 ships with exactly one real tool: **`search_knowledge_base`** (RAG retrieval). CRM/email/ATS
tools are written against this same contract when they are added — no router redesign needed.
