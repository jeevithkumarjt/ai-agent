# 11 — CI/CD

Single GitHub Actions engine with environment-gated jobs. Pipeline stages:

```
┌─ lint ─ typecheck ─ unit ─ build
├─ security: trufflehog/secrets, semgrep (SAST), pip-audit + npm audit (SCA),
│            trivy container scan, hadolint, tfsec, gitleaks
├─ integration (compose stack): API tests, retrieval tests against real Qdrant/Postgres/Redis
├─ e2e (Playwright) against built web+api
├─ eval gate: golden dataset against deployed candidate → must exceed current baseline score
├─ migrate: alembic upgrade head on staging
├─ build & push images (digest tags) + SBOM + cosign attest
└─ deploy: staging (auto) → prod (blue/green or canary, manual approval)
```

## 11.1 Workflows

| Workflow | Triggers | Contents |
|----------|----------|----------|
| `ci.yml` | PR | lint, typecheck, unit, build, security, integration |
| `cd.yml` | merge to main | full pipeline → staging → gate → prod deploy |
| `eval-gate.yml` | deploy candidates / daily | golden-dataset regression, blocks promotion |
| `nightly.yml` | cron | load test (k6), dependency bump PRs (renovate), eval refresh |
| `scan.yml` | nightly / PR | full security surface |

## 11.2 Gates (fail = stop)

1. Typecheck (strict) + lint zero errors.
2. Unit+integration green.
3. Trivy critical/high CVEs → block.
4. SCA no known-vulnerable direct deps.
5. Eval score ≥ baseline (no regression).
6. Billing/cost sanity (env guard) — no runaway model selection in defaults.

## 11.3 Rollback

Images tagged with `GITHUB_SHA`; rollback = redeploy previous tag + `alembic downgrade` not used
(expand/contract forward-only); data rollback via PITR if required.
