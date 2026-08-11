# 08 — Security

## 8.1 Threat model highlights

| Threat | Mitigation |
|--------|------------|
| Prompt injection from crawled content | Content is never executed as instructions; retrieved text is delimited, escaping applied, `<system>`-like markers neutralized; a prompt-injection scanner scores each chunk pre-context |
| Jailbreak / adversarial user | Inbound prompt-injection + jailbreak classifier before orchestration; guardrails reject with generic response |
| PII leakage | PII scanner (regex + optional Presidio) flags/redacts in retrieved context and user input per policy |
| Sensitive docs | Per-source sensitivity classification; denied sources filtered from all tenants; admin overrides audited |
| Tenant isolation | Row-level ownership enforced in repository layer + Qdrant payload tenant filter on every query; never rely on UI-only hiding |
| API key theft | Keys stored as SHA-256, scoped, expiring, revocable; audit on use |
| SSRF (crawler) | URL allow/deny list, private-IP block, DNS rebinding protection, redirect sanitization |
| Webhook forgery | HMAC signature + timestamp window + replay nonce |
| Secrets in code | Central `settings`/vault; no secrets in images; scanning in CI |
| DoS | Rate limiting (global + chat), payload size caps, concurrency limits |

## 8.2 Authentication & authorization

- **AuthN**: internal JWT (access 30m + refresh 14d, rotation on refresh) or OAuth (OIDC) —
  `AUTH_PROVIDER`. Passwords hashed with argon2id.
- **AuthZ**: RBAC roles `owner > admin > editor > viewer`, plus API-key scopes
  (`chat:read`, `chat:write`, `sources:write`, `admin:read`...). Middleware resolves roles per
  route; repository layer re-checks tenant ownership.
- Rate limiting via Redis sliding window.

## 8.3 Guardrails pipeline

```
User input
 ├─ PII scan (redact for logging/context)
 ├─ Prompt-injection scan (score > θ → sanitize or refuse)
 ├─ Jailbreak classifier (model-gateway "fast" tier)
 ├─ Content moderation (toxic/offensive) → refuse politely
 └─ Length caps
Crawled content
 ├─ Injection-score chunks (never treated as instructions)
 ├─ Sensitivity classifier (per-source policy)
 └─ Escape/neutralize prompt-breaking constructs in context assembly
```

## 8.4 Audit & governance

- `audit_logs` append-only for: auth events, source create/update/delete, reindex, model/prompt
  changes, admin overrides, eval runs, export.
- Answer provenance: every `message` stores model/provider/version, prompt version, chunk ids +
  doc versions → full lineage replay.
- Compliance export: endpoint aggregates lineage + audit for a tenant.

## 8.5 Encryption

- TLS everywhere (ingress). At rest: Postgres/Redis/Qdrant encrypted volumes (K8s PVC w/ KMS).
- Application-level encryption for secrets/API keys at rest using `SECRET_KEY`/KMS envelope.
- Object storage SSE (S3/Azure/GCS managed keys).

## 8.6 OWASP alignment

Injection, broken access control (RBAC+ownership), cryptographic failures (argon2id, strong
random), insecure design (SSRF guard, validated connectors), misconfiguration (baseline manifests,
CI secret scan), vulnerable components (SCA scan), logging (redaction of PII/secrets), SSRF
(dedicated), CSRF (SameSite+origin checks on web).
