# 18 — Testing Strategy

## 18.1 Pyramid

| Layer | Tooling | Scope |
|-------|---------|-------|
| Unit | pytest | chunking, hashing, RRF, confidence, validators, guards, providers (mocked) |
| Integration | pytest + testcontainers/compose | DB repos, Qdrant client, crawler (local fixture server), parsers, cache |
| Contract | schema tests + OpenAPI snapshot | API schemas stable across changes; webhook signature contract |
| E2E | Playwright | chat flow, citations panel, admin flows, auth |
| Load | k6 / locust | RAG p95 targets, cache hit effect, ingest 1000-page target |
| Stress/Chaos | k6 + chaos-mesh | provider outages, Qdrant/Redis kill, partial crawls |
| Security | semgrep + trivy + manual | OWASP, injection/PII guard tests, SSRF |
| **AI eval** | harness + golden set | retrieval precision/recall, groundedness, citation correctness, freshness, hallucination rate |

## 18.2 Golden dataset & eval runner

- `golden_questions` table + `tests/eval/` seeds: each entry `{question, expected_facts[],
  expected_source_url, category}`.
- Runner executes the full pipeline (no LLM mocking for groundedness part; optional LLM stub mode)
  and computes:
  - `recall` = expected facts present in answer
  - `citation_score` = expected source url in citations
  - `grounded_score` = verifier containment ratio
  - `refusal_accuracy` = correct refusals vs guessing
  - `freshness` = for a curated changing question, answer matches latest
- Overall = weighted mean; regression = drop > 2% vs baseline → block.

## 18.3 Test fixtures

- `tests/fixtures/` static HTML/MD/PDF/CSV/DOCX samples + a local `http` fixture server with
  ETag/Last-Modified/robots/sitemap for crawler tests.
- Factories for domain entities (SQLAlchemy factories), seeded vector collections per test
  (transactional rollback + unique Qdrant collection names).

## 18.4 CI wiring

`ci.yml` runs unit → integration (compose) → e2e (Playwright, headed=off) → security scans.
`cd.yml` adds eval gate. `nightly.yml` runs load + full eval regression.
