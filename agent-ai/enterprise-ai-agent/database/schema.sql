-- Enterprise AI Agent — schema.sql
-- Single source of truth for DDL (see 03-data-model.md for the abbreviated model).
-- Locked per 01-architecture-decisions.md. Postgres + pgvector (ADR-001), tenant scoping (ADR-004).

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

-- ---------------------------------------------------------------------------
-- Tenants (one row today, multi-tenant-ready schema — ADR-004)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tenants (
    id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        text NOT NULL,
    created_at  timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Users
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id     uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    email         text NOT NULL,
    role          text NOT NULL DEFAULT 'viewer' CHECK (role IN ('owner', 'admin', 'editor', 'viewer')),
    password_hash text NOT NULL,
    created_at    timestamptz NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, email)
);
CREATE INDEX IF NOT EXISTS idx_users_tenant ON users (tenant_id);

-- ---------------------------------------------------------------------------
-- Conversations
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS conversations (
    id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id   uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_conversations_tenant ON conversations (tenant_id);
CREATE INDEX IF NOT EXISTS idx_conversations_tenant_user ON conversations (tenant_id, user_id);

-- ---------------------------------------------------------------------------
-- Messages — full conversation history; role = user / assistant / tool
-- tool_calls jsonb mirrors the Anthropic tool_use/tool_result blocks so the LLM
-- conversation can be reconstructed verbatim from history.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS messages (
    id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id  uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    tenant_id        uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    role             text NOT NULL CHECK (role IN ('user', 'assistant', 'tool')),
    content          text NOT NULL DEFAULT '',
    tool_calls       jsonb,
    created_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_messages_tenant ON messages (tenant_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages (conversation_id, created_at);

-- ---------------------------------------------------------------------------
-- Document chunks — the RAG vector store (ADR-001, 02-agent-and-rag-workflow.md)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS document_chunks (
    id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id   uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    source_id   text NOT NULL,
    chunk_text  text NOT NULL,
    embedding   vector(1536) NOT NULL,
    metadata    jsonb NOT NULL DEFAULT '{}'::jsonb,
    -- Generated lexical index (BM25-style tsvector) so hybrid search (ts_rank +
    -- cosine similarity) runs in one table — no separate in-memory BM25 to drift.
    tsv         tsvector GENERATED ALWAYS AS (to_tsvector('english', chunk_text)) STORED,
    created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_document_chunks_tenant ON document_chunks (tenant_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_source ON document_chunks (tenant_id, source_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_tsv ON document_chunks USING GIN (tsv);

-- ---------------------------------------------------------------------------
-- Usage metering (billing & tier enforcement, ADR-021)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usage_metrics (
    id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id     uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    date          date NOT NULL,
    messages_sent integer NOT NULL DEFAULT 0,
    seats         integer NOT NULL DEFAULT 0,
    kb_size_mb    numeric NOT NULL DEFAULT 0,
    UNIQUE (tenant_id, date)
);

-- Index for daily reports across tenants
CREATE INDEX IF NOT EXISTS idx_usage_metrics_tenant_date ON usage_metrics (tenant_id, date);

-- ivfflat index on embedding: intentionally SKIPPED for MVP row counts — flat scan is
-- fine under ~50k rows (ADR-001). Enable when row count justifies it:
-- CREATE INDEX idx_document_chunks_embedding ON document_chunks
--     USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- ---------------------------------------------------------------------------
-- Tool calls — audit log, doubles as debugging trace (02-agent-and-rag-workflow.md)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tool_calls (
    id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id  uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    tenant_id        uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    tool_name        text NOT NULL,
    input            jsonb NOT NULL,
    output           jsonb NOT NULL,
    duration_ms      integer NOT NULL DEFAULT 0,
    success          boolean NOT NULL DEFAULT true,
    created_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tool_calls_tenant ON tool_calls (tenant_id);
CREATE INDEX IF NOT EXISTS idx_tool_calls_conversation ON tool_calls (conversation_id, created_at);
