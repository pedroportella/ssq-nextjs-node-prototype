# Operational Reliability And Support Evidence

This note maps the SSQ prototype to reliability, support, high availability and high-security-assurance expectations.

It is a review-runtime evidence pack, not a production operations claim. DigitalOcean App Platform is used only as prototype review infrastructure, and the current database posture is not hardened production hosting.

## Review-Runtime Availability Assumptions

| Area | Implemented for review | Production-next requirement |
| --- | --- | --- |
| Frontend apps | Three separately deployable Next.js apps with `/status` endpoints and app-local Dockerfiles. | Environment promotion, custom domains, final TLS ownership, rollback policy, CDN/cache strategy if needed and production SLOs. |
| Backend API | Fastify service with `/health`, `/health/live`, `/health/ready`, GraphQL and REST upload/download routes. | Horizontal scaling policy, private networking, production ingress, capacity planning and SLO/error-budget management. |
| Database | PostgreSQL migrations, seeds, readiness check and local Docker volume; review deployment uses review database posture. | Managed database operations with backups, point-in-time recovery, high availability, maintenance windows, credential rotation and restore drills. |
| Async handoff | Persisted outbox events and admin summary route. | Real queue worker, retry policy, idempotency, dead-letter handling, alerting and replay/reconciliation controls. |
| Identity and authorisation | Demo role headers with citizen/reviewer/admin boundaries for review. | Real myQLD/QIB/SSO/IAM integration, auditable authorisation, staff/team/agency scoping and access-review process. |
| Documents | Metadata-only upload policy with ownership/type/size/category checks. | Private object storage, malware scanning, retention, privacy review, encryption policy and document access audit. |

## Health And Readiness Evidence

| Check | What it proves | Evidence |
| --- | --- | --- |
| `GET /health` | Backend runtime can return service/version/environment health. | [health route](../backend/src/routes/health.ts), [backend app tests](../backend/src/app.test.ts). |
| `GET /health/live` | Backend process liveness. | [health route](../backend/src/routes/health.ts), [backend app tests](../backend/src/app.test.ts). |
| `GET /health/ready` | Backend runtime plus database reachability; returns `503` when the database is down. | [health route](../backend/src/routes/health.ts), [backend app tests](../backend/src/app.test.ts), [full-stack smoke](../scripts/full-stack-smoke.mjs). |
| Frontend `/status` | Each public frontend app can report its own app identity and `UP` status. | [dashboard status](../frontend/apps/dashboard/src/app/status/route.ts), [Seniors Card status](../frontend/apps/seniors-card/src/app/status/route.ts), [Rental Security Subsidy status](../frontend/apps/rental-security-subsidy/src/app/status/route.ts). |
| Full-stack smoke | Backend readiness, all frontend statuses, GraphQL seeded profile/catalogue reads and backend-rendered frontend pages. | [full-stack-smoke.mjs](../scripts/full-stack-smoke.mjs), [release runbook](release-runbook.md). |

Quick public status checks:

```bash
curl -i https://ssq-dashboard-swgsm.ondigitalocean.app/status
curl -i https://ssq-seniors-card-lfzpt.ondigitalocean.app/status
curl -i https://ssq-rental-security-subsidy-kgbzf.ondigitalocean.app/status
```

Local full-stack review:

```bash
pnpm install
pnpm docker:build
pnpm docker:up:backend
pnpm test:full-stack-smoke
pnpm docker:down
```

## Support Triage Runbook

Use this runbook for prototype review support. It is intentionally lightweight because the deployment is not production.

1. Check the public frontend `/status` endpoints.
2. If a frontend status is down, inspect the app deployment/runtime first; the public frontend apps should not expose backend/internal URLs to browser JavaScript.
3. If maintainers have the private backend review URL, check backend readiness with `/health/ready`.
4. If readiness reports database down, treat it as a database connectivity/runtime issue before debugging GraphQL or frontend pages.
5. Run `pnpm test:full-stack-smoke` against local or configured review URLs to verify the whole path.
6. Use `x-correlation-id` when making backend requests so logs and safe errors can be tied together.
7. For submitted-workflow issues, check service request status/activity and persisted outbox summary before assuming a frontend rendering issue.
8. Keep backend/admin/operations URLs, app IDs, generated deployment specs and local environment values out of public docs and screenshots.

Useful local commands:

```bash
pnpm docker:logs
pnpm test:full-stack-smoke
pnpm --dir backend test
pnpm guard:artifacts
pnpm guard:terminology
pnpm guard:frontend-source
```

## Incident Investigation Evidence

| Concern | Implemented signal | Evidence |
| --- | --- | --- |
| Correlation | Supplied `x-correlation-id` is preserved; missing IDs are generated and returned on responses. | [observability.ts](../backend/src/plugins/observability.ts), [app tests](../backend/src/app.test.ts). |
| Safe errors | Not-found, rate-limit and generic REST errors use safe payloads with correlation IDs and no stack traces. | [observability.ts](../backend/src/plugins/observability.ts), [hardening.ts](../backend/src/plugins/hardening.ts), [app tests](../backend/src/app.test.ts). |
| Redaction | Logger redacts common secret-bearing headers and payload fields. | [logger.ts](../backend/src/logger.ts). |
| Status lifecycle | Status changes write activity events with correlation ID, previous status, next status and reason. | [serviceRequestStatusLifecycleService.ts](../backend/src/services/serviceRequestStatusLifecycleService.ts), [GraphQL tests](../backend/src/graphql/graphqlRoute.test.ts). |
| Outbox | Submission and status work can persist outbox events; admin route summarises event counts by status/type. | [outboxEventService.ts](../backend/src/services/outboxEventService.ts), [operations route](../backend/src/routes/operations.ts), [operations tests](../backend/src/routes/operations.test.ts). |
| Guardrails | Artefact, terminology, frontend-source and browser-bundle guards reduce accidental local/spec/secret leakage and public-prose drift. | [quality guards](../scripts/quality-guards.mjs), [CI workflow](../.github/workflows/ci.yml). |

## Release And Quality Gates

The review release path uses:

- pinned Node.js and pnpm versions;
- lint, typecheck and test gates;
- production builds for backend, shared packages and three apps;
- artefact, terminology and frontend-source guards;
- browser bundle guard after frontend production builds;
- Docker Compose validation and Docker image builds;
- local and deployed full-stack smoke paths.

Evidence:

- [CI workflow](../.github/workflows/ci.yml)
- [release runbook](release-runbook.md)
- [local development](local-development.md)
- [frontend deployment readiness](frontend-deployment-readiness.md)
- [digitalocean deployment](digitalocean-deployment.md)

## Production Hardening Backlog

### Identity And Authorisation

- Replace demo headers with real myQLD/QIB/SSO/IAM.
- Add auditable authorisation for citizens, staff, teams, agencies and operations users.
- Scope activity, evidence and operational reads by role and ownership.
- Add access-review and privileged-operation audit trails.

### Document Storage, Scanning And Retention

- Store files in private object storage.
- Add malware scanning and quarantine workflow.
- Enforce retention and disposal policy.
- Add privacy review and access audit.

### Outbox, Queue And Worker Reliability

- Attach a real queue/broker to outbox events.
- Add retry, idempotency, dead-letter and replay policy.
- Monitor pending/failed event counts.
- Add reconciliation jobs for missed or partial handoffs.

### Observability And Alerting

- Ship structured logs to a central platform.
- Add metrics, traces and dashboards for latency, error rate, readiness, queue lag and saturation.
- Define alert thresholds, routing and escalation.
- Add runbooks for common failure modes.

### Database Operations

- Use managed PostgreSQL with backups, point-in-time recovery and high availability.
- Define migration policy, rollback strategy and drift checks.
- Run restore drills.
- Rotate credentials and document maintenance windows.

### Deployment Governance

- Add environment promotion controls and manual approvals.
- Use OIDC/IAM-backed deployment credentials.
- Define rollback/smoke gates after deployment.
- Keep generated specs, app IDs and backend/admin URLs out of Git.

### Security, Privacy And Accessibility Assurance

- Run threat modelling, privacy impact assessment and penetration testing.
- Complete manual screen-reader and assistive technology review.
- Add browser/device coverage and representative-user accessibility review.
- Document production SLOs, incident severity definitions and support ownership.

## What This Proves For The Role

The prototype shows platform support thinking beyond feature delivery: health checks, readiness, smoke tests, safe errors, correlation, outbox visibility, deployment guardrails, release handover and explicit production-hardening backlog. It also stays honest about what remains required for high availability, high-security-assurance and production operations.
