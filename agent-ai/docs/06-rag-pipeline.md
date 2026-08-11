# 06 — RAG Pipeline

## 6.1 Query-time pipeline (agentic workflow)

```
User question
  → Intent classifier (fast LLM; modes: factual | howto | comparison | troubleshooting | out-of-scope)
  → Planner/Query-rewriter (rewrite: de-referencing pronouns, expanding abbreviations, adding domain terms)
  → Multi-query expansion (n paraphrases; n<=3) [config]
  → Hybrid retrieval per rewritten query:
       · dense: query vector → Qdrant cosine, filtered by workspace+source_version+type
       · sparse: BM25/SPLADE lexical index (Qdrant sparse vectors or rank_bm25 fallback)
       · kg: 1-hop neighbors of top entities [config]
  → Reciprocal Rank Fusion (k=60) merges ranked lists
  → Metadata filter re-application + hard tenant isolation
  → Cross-encoder rerank top-24 → top-8 (bge-reranker-v2-m3)
  → Confidence score from rerank scores (max, calibrated)
  → Context compression: extract sentences from top chunks most relevant to question (LLM or lexical)
  → Grounding check: every compressed sentence must map to a retrieved chunk
  → Synthesis (grounded prompt, JSON citation anchors)
  → Output validator:
       · citations non-empty & urls exist in context
       · each factual sentence has a supporting span in context (nli/lexical)
       · no "I don't know" mismatch with confidence
  → If confidence < threshold OR validator fails → refusal answer + suggest alternatives
  → SSE stream + persist message + response cache
```

## 6.2 Confidence scoring

- Raw: average top-k rerank scores, scaled.
- Calibrated with document-level signals: freshness (decay since published_at), source reliability,
  chunk density, cross-check agreement among multi-query results.
- `RETRIEVAL_CONFIDENCE_THRESHOLD=0.55`. Below it → refusal with explanation and the closest sources
  listed as "related", never as "answer".

## 6.3 Hallucination guard (three layers)

1. **Pre**: grounded prompt constrains model to given context; `{{context}}` formatted with explicit
   citations; system prompt forbids external knowledge.
2. **In**: streaming verifier inspects emitted claims against context spans (local NLI / lexical
   containment); flagged spans are struck or marked.
3. **Post**: `AnswerValidator` checks citations resolve to context and claims are contained;
   otherwise the answer is rewritten once with stricter constraints or refused.

## 6.4 Metadata filtering

Payload fields on every vector: `chunk_id, document_id, source_id, tenant_id, url, heading,
section_path, content_type, doc_version, source_version, published_at, updated_at, lang, category`.
Filters combine AND: tenant + source_version + optional type/lang/date-range.

## 6.5 Caching layers (query path)

| Layer | Key | TTL | Invalidation |
|-------|-----|-----|--------------|
| Embedding cache | text+model | 24h | none (immutable text→vector) |
| Retrieval cache | query+filters+version | 15m | on source_version bump |
| Query cache | normalized query | 5m | — |
| Response cache | full request+version | 5m | on source_version bump |
| Browser/CDN | static assets | long | hash-based |

## 6.6 Memory integration

- **Session memory** (Redis TTL 24h): recent turns for pronoun resolution.
- **Conversation memory** (Redis TTL 24h): rolling summary via cheap model, injected as context.
- **User memory** (Redis TTL 90d): stated preferences/context relevant to the workspace.
- **Workspace memory**: pinned facts curated by admins, injected as authoritative context.
Memory is always *below* retrieved context in priority; the model is told memory may be stale.

## 6.7 Evaluations (AI eval framework)

Golden dataset of expected question→facts→source. Run after every ingestion event and deploy:
- Retrieval precision@k / recall@k
- Citation correctness (URL expected present)
- Groundedness (claims contained in context)
- Hallucination rate (refusals that guessed vs refused)
- Freshness (answer reflects latest version for a changing question)
Regressions block deploy/ingest-promotion (see `18-testing.md`).
