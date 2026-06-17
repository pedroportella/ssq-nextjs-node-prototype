# Operational Reliability And Support Evidence

Evidence for review-time reliability and support handover. This is not a production support model.

## What Exists

| Area | Evidence |
| --- | --- |
| Backend health | `/health`, `/health/live` and `/health/ready` include database readiness. |
| Frontend status | Each public app exposes `/status` for quick review checks. |
| Smoke checks | `pnpm test:full-stack-smoke` checks backend readiness, GraphQL reads and backend-rendered app pages. |
| E2E checks | `pnpm test:e2e:mock` covers frontend workflow/accessibility paths; `pnpm test:e2e:real` uses the Docker-backed backend runtime. |
| Traceability | Correlation IDs, safe errors and structured logs support local incident investigation. |
| Release guardrails | `pnpm test:reviewer-evidence`, artefact guards, terminology guards, browser-bundle guards and CI checks. |

## Quick Triage

1. Check the live app status URLs in [live-review-links.md](live-review-links.md).
2. Run the local smoke path from [release-runbook.md](release-runbook.md).
3. Check backend readiness before debugging frontend rendering.
4. Use correlation IDs from responses/logs when tracing backend errors.
5. If the browser sees backend origins, run `pnpm guard:frontend-source` and `pnpm guard:browser-bundles`.

## Production-Next Support Work

- Real alert routing, on-call ownership, escalation paths and service-level objectives.
- Log shipping, metrics, tracing, dashboards and retention controls.
- Database backup, restore, point-in-time recovery and credential rotation.
- Queue worker monitoring, retry policy, replay and dead-letter handling.
- Incident, privacy, security and accessibility assurance runbooks.
- Environment promotion controls and rollback automation.

## Verification

```bash
pnpm test:reviewer-evidence
pnpm test:full-stack-smoke
pnpm test:e2e:mock
pnpm test:e2e:real
```
