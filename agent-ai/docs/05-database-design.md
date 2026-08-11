# 05 — Database Design

PostgreSQL 16 is the metadata source of truth. Qdrant holds derived embeddings. Redis holds
cache/memory/rate-limits. Migrations: Alembic.

## 5.1 Schema (abridged DDL)

```sql
CREATE TABLE tenants (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  slug          text NOT NULL UNIQUE,
  plan          text NOT NULL DEFAULT 'pro',
  settings      jsonb NOT NULL DEFAULT '{}',
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email         text NOT NULL,
  password_hash text,                       -- NULL if OAuth-only
  role          text NOT NULL DEFAULT 'viewer',  -- owner|admin|editor|viewer
  status        text NOT NULL DEFAULT 'active',
  last_login_at timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, email)
);

CREATE TABLE api_keys (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id       uuid REFERENCES users(id) ON DELETE SET NULL,
  name          text NOT NULL,
  key_hash      text NOT NULL UNIQUE,       -- sha256(key)
  scopes        text[] NOT NULL DEFAULT '{}',
  expires_at    timestamptz,
  last_used_at  timestamptz,
  revoked_at    timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE knowledge_sources (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  type          text NOT NULL,              -- connector type
  display_name  text NOT NULL,
  config        jsonb NOT NULL DEFAULT '{}',
  state         text NOT NULL DEFAULT 'enabled',  -- enabled|paused|disabled
  schedule      jsonb NOT NULL DEFAULT '{}',      -- {mode, cron}
  version       bigint NOT NULL DEFAULT 1,        -- bump on every content change
  last_crawl_at timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE documents (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  source_id      uuid NOT NULL REFERENCES knowledge_sources(id) ON DELETE CASCADE,
  canonical_url  text NOT NULL,
  content_type   text NOT NULL,
  title          text,
  lang           text,
  sha256         text NOT NULL,             -- full-content hash
  etag           text,
  last_modified  text,
  version        bigint NOT NULL DEFAULT 1,
  status         text NOT NULL DEFAULT 'pending',  -- pending|downloaded|parsed|embedded|failed|deleted
  error          text,
  published_at   timestamptz,
  updated_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source_id, canonical_url)
);
CREATE INDEX idx_documents_source   ON documents (tenant_id, source_id, status);
CREATE INDEX idx_documents_updated  ON documents (updated_at DESC);

CREATE TABLE chunks (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  document_id   uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  doc_version   bigint NOT NULL,            -- must equal documents.version at embed time
  section_path  text NOT NULL DEFAULT '/',
  heading       text,
  text          text NOT NULL,
  char_offset   integer NOT NULL DEFAULT 0,
  lang          text,
  sha256        text NOT NULL,
  embedded      boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_chunks_document ON chunks (document_id, doc_version);
CREATE INDEX idx_chunks_embedded ON chunks (tenant_id, embedded);

CREATE TABLE conversations (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id       uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title         text,
  pinned        boolean NOT NULL DEFAULT false,
  shared_token  text,                       -- share link token
  archived_at   timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE messages (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  tenant_id     uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  role          text NOT NULL,              -- user|assistant|system
  content       text NOT NULL,
  citations     jsonb NOT NULL DEFAULT '[]',
  confidence    numeric(4,3),
  grounded      boolean,
  model         text,
  provider      text,
  tokens_in     integer,
  tokens_out    integer,
  latency_ms    integer,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_messages_session ON messages (session_id, created_at);

CREATE TABLE feedback (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id    uuid NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  tenant_id     uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  rating        smallint NOT NULL CHECK (rating BETWEEN -1 AND 1),
  comment       text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE prompts (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name          text NOT NULL,
  key           text NOT NULL,              -- e.g. answer.synthesis
  version       bigint NOT NULL DEFAULT 1,
  template      text NOT NULL,
  config        jsonb NOT NULL DEFAULT '{}',
  active        boolean NOT NULL DEFAULT true,
  created_by    uuid REFERENCES users(id),
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, key, version)
);
CREATE INDEX idx_prompts_active ON prompts (tenant_id, key) WHERE active;

CREATE TABLE model_configs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  provider      text NOT NULL,
  model         text NOT NULL,
  role          text NOT NULL,              -- fast|default|reasoning|embedding|reranker
  enabled       boolean NOT NULL DEFAULT true,
  config        jsonb NOT NULL DEFAULT '{}',
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE crawl_jobs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  source_id     uuid NOT NULL REFERENCES knowledge_sources(id) ON DELETE CASCADE,
  kind          text NOT NULL,              -- full|incremental|single
  status        text NOT NULL DEFAULT 'queued',  -- queued|running|completed|failed|partial
  total_pages   integer NOT NULL DEFAULT 0,
  changed_pages integer NOT NULL DEFAULT 0,
  failed_pages  integer NOT NULL DEFAULT 0,
  error         text,
  started_at    timestamptz,
  finished_at   timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_crawl_jobs_source ON crawl_jobs (source_id, created_at DESC);

CREATE TABLE events (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  type          text NOT NULL,              -- e.g. source.created, doc.parsed, chunk.embedded, cache.invalidated
  payload       jsonb NOT NULL DEFAULT '{}',
  actor         text,
  trace_id      text,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_events_type_time ON events (tenant_id, type, created_at DESC);

CREATE TABLE golden_questions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  question      text NOT NULL,
  answer_fragments text[] NOT NULL DEFAULT '{}',  -- expected substrings / facts
  source_url    text,                        -- expected citation
  category      text NOT NULL DEFAULT 'general',
  active        boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE eval_runs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  trigger       text NOT NULL,               -- cron|deploy|manual|post_ingest
  status        text NOT NULL DEFAULT 'running',
  score_overall numeric(5,4),
  score_grounded numeric(5,4),
  score_citation numeric(5,4),
  score_freshness numeric(5,4),
  passed        boolean,
  details       jsonb NOT NULL DEFAULT '{}',
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE audit_logs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  actor_id      uuid,
  action        text NOT NULL,
  resource_type text,
  resource_id   text,
  meta          jsonb NOT NULL DEFAULT '{}',
  ip            text,
  created_at    timestamptz NOT NULL DEFAULT now()
);
```

## 5.2 Partitioning & retention

- `messages` and `events`: monthly partitions (native partition by `created_at`), dropped after
  retention window (messages: 24 months, events: 12 months, audit: 24 months).
- `chunks`: hash-partitioned by `tenant_id` at very large scale (million+ docs).

## 5.3 Backups & HA

- WAL archiving (pg_basebackup + archive_command to object storage), PITR.
- Replica via streaming replication; read workloads route to replicas.
- See `13-disaster-recovery.md` for RPO=0 / RTO<15min design.

## 5.4 Redis key layout

```
agentai:{tenant}:cache:retrieval:{hash(query, filters, version)}
agentai:{tenant}:cache:query:{hash}
agentai:{tenant}:cache:response:{hash}
agentai:{tenant}:cache:embedding:{model}:{hash(text)}
agentai:{tenant}:memory:session:{session_id}        (TTL 24h)
agentai:{tenant}:memory:conversation:{session_id}   (compressed summary)
agentai:{tenant}:memory:user:{user_id}              (preferences, TTL 90d)
agentai:{tenant}:ratelimit:{user}:{endpoint}
agentai:lock:{job_id}                               (distributed locks)
agentai:{tenant}:version:{source_id}                (current source version)
```
All content-touching caches are invalidated by bumping `source_version` and deleting the matching
namespace (pattern scan with SCAN, not KEYS).
