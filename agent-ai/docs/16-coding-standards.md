# 16 — Coding Standards

## 16.1 Repo conventions

- Monorepo; `apps/` for deployables, `packages/` for shared code, `infra/` for ops, `docs/` for
  documentation.
- Backend: Python 3.12, strict `mypy`, `ruff` (E,F,I,UP,B,SIM,ASYNC), `black` formatting (88 cols).
- Frontend: TypeScript strict (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`), ESLint
  (typescript-eslint recommended-type-checked), Prettier.
- Tests co-located: `tests/` per app mirroring package layout.

## 16.2 Naming

- Python: `snake_case` functions/vars, `PascalCase` classes, `UPPER_SNAKE` constants, `I<Name>` for
  interfaces in `infrastructure/providers`, `Base<Repo>` repositories.
- TS: `PascalCase` components/types, `camelCase` functions, `useX` hooks, `XProps` props type.
- Commands: `verb-noun` in API routes (`POST /sources/{id}/crawl`).

## 16.3 Error handling

- Backend: typed exceptions in `domain/errors.py`; middleware maps to RFC 7807 problem+json.
  Never raise raw `HTTPException` from application/services layer — use domain exceptions + mapper.
- Retryable vs non-retryable exceptions distinguished (used by Celery auto-retry).
- Frontend: typed fetch layer; single `ApiError`; error boundaries per route; no `any` in catch.

## 16.4 Logging

Structured JSON, levels: `debug` (local), `info`, `warning`, `error`, `critical`. Every entry
carries `{ts, level, logger, trace_id, tenant_id, ...}`. Never log secrets/PII (see 08).

## 16.5 Dependency rules (clean architecture)

```
interfaces (API) → application (services) → infrastructure (repo/providers) → db/sdk
                    domain (models, schemas, errors) — depends on nothing above
```
- `interfaces` may import `application` + `domain`.
- `application` imports `domain` + `infrastructure` interfaces (protocols) — DI injects impls.
- No framework imports inside `domain`.
- Circular imports forbidden (ruff rules enforced).

## 16.6 API versioning

- Path versioning `/api/v1/...`. Breaking change → `/api/v2`; old kept until deprecation window.
- Internal service calls never depend on unstable schemas.

## 16.7 Git workflow

- `main` protected; feature branches `feat/`, `fix/`, `chore/`.
- Conventional Commits: `feat:`, `fix:`, `refactor:`, `chore:`, `docs:`, `test:`.
- PR merges squash; linear history; PR must pass CI gates.
