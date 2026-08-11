# 03 — Domain Model

## 3.1 Core entities

```
Tenant (workspace)
  ├── User (authn, roles: owner, admin, editor, viewer)
  ├── ApiKey (per-tenant, hashed, scoped)
  ├── KnowledgeSource (connector instance)
  │     type: website|sitemap|pdf|docx|csv|txt|md|image|video|api|sharepoint|confluence|notion|gdrive|onedrive|crm
  │     config: JSONB (connector-specific, schema-validated)
  │     state: enabled|paused|disabled
  ├── Document (a single crawlable unit: a page, a PDF, ...)
  │     source_id, canonical_url, content_type, sha256, etag, last_modified,
  │     version (int), status: pending|downloaded|parsed|embedded|failed
  ├── Chunk (semantic/heading-aligned slice of a document)
  │     doc_id, doc_version, section_path, char_offset, text, sha256, lang
  ├── Embedding (derived, lives in Qdrant; payload carries chunk_id+version)
  ├── Topic / Entity (knowledge-graph layer)
  ├── Conversation (session)
  │     └── Message (role, content, citations JSONB, confidence, grounded bool, model, provider, tokens)
  ├── Feedback (thumbs, comment, correctness)
  ├── Prompt (versioned prompt templates)
  ├── ModelConfig (provider routing rules)
  ├── CrawlJob / JobRun / WorkerTask (durable queue state)
  ├── Event (audit + domain events)
  ├── GoldenQuestion (eval dataset)
  │     └── EvalRun / EvalResult
```

## 3.2 ER diagram

```
tenant ─┬─< user
        ├─< api_key
        ├─< knowledge_source ─┬─< crawl_job
        │                     └─< document ─< chunk ─< embedding(Qdrant)
        ├─< conversation ─< message
        ├─< topic <─> document          (knowledge graph edges)
        ├─< entity <─> chunk
        ├─< prompt (versioned)
        ├─< model_config
        ├─< golden_question ─< eval_run ─< eval_result
        └─< event
feedback > message
message > citation (embedded JSONB: url, heading, chunk_id, doc_version)
```

## 3.3 Invariants

1. A `Chunk` always belongs to exactly one `Document` version; `chunk.doc_version == doc.version` at embed time.
2. A vector payload in Qdrant is only valid if its `doc_version` equals the document's current version.
3. `Document.sha256` is the full-content hash; if unchanged, no reparse/rechunk/re-embed happens.
4. `Chunk.sha256` per chunk — only changed chunks are re-embedded (paragraph-level diff).
5. Every `Message` that answers a question carries ≥1 citation, or `grounded=false` + refusal text.
6. Cache namespaces are keyed by source_version; invalidation is atomic per namespace.
7. Events are immutable; audit events are append-only.
8. API keys are stored as SHA-256 hashes only; plaintext shown once at creation.

## 3.4 Chunking model

`ChunkStrategy.heading` (default): split by heading/section boundaries, then size windows with
overlap. Section path is preserved in metadata so citations can reference the exact heading:
`/products/virtual-assistant/features`. This gives parent–child semantics: page = parent, sections = children.

## 3.5 Knowledge graph

Optional enrichment layer (`SEARCH_USE_KNOWLEDGE_GRAPH=true`): extract topics/entities per chunk
(local NLP pipeline, no external cost), store edges; retrieval augments dense+sparse hits with
neighboring chunks (1-hop) to improve recall on cross-page questions.
