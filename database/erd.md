# ER Diagram

**Status: Locked.** Companion to `03-data-model.md`; full DDL in `database/schema.sql`.

```mermaid
erDiagram
    TENANTS ||--o{ USERS : has
    TENANTS ||--o{ CONVERSATIONS : has
    TENANTS ||--o{ DOCUMENT_CHUNKS : has
    TENANTS ||--o{ TOOL_CALLS : has
    USERS ||--o{ CONVERSATIONS : owns
    CONVERSATIONS ||--o{ MESSAGES : contains
    CONVERSATIONS ||--o{ TOOL_CALLS : contains

    TENANTS {
        uuid id PK
        text name
        timestamptz created_at
    }
    USERS {
        uuid id PK
        uuid tenant_id FK
        text email
        text role
        text password_hash
        timestamptz created_at
    }
    CONVERSATIONS {
        uuid id PK
        uuid tenant_id FK
        uuid user_id FK
        timestamptz created_at
    }
    MESSAGES {
        uuid id PK
        uuid conversation_id FK
        uuid tenant_id FK
        text role
        text content
        jsonb tool_calls
        timestamptz created_at
    }
    DOCUMENT_CHUNKS {
        uuid id PK
        uuid tenant_id FK
        text source_id
        text chunk_text
        vector embedding
        jsonb metadata
        timestamptz created_at
    }
    TOOL_CALLS {
        uuid id PK
        uuid conversation_id FK
        uuid tenant_id FK
        text tool_name
        jsonb input
        jsonb output
        int duration_ms
        boolean success
        timestamptz created_at
    }
```

Notes:

- `users` has a unique constraint on `(tenant_id, email)`.
- `document_chunks.embedding` is `vector(1536)`; similarity uses cosine distance (`<=>`).
- The `ivfflat` index is intentionally deferred (ADR-001) — flat scan is fine under ~50k rows.
