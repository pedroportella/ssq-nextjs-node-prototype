# API And Security Evidence

Evidence for backend/API design, GraphQL integration and prototype security boundaries. This is not a production security assurance claim.

## Runtime Shape

- Fastify owns HTTP routing, health probes, REST endpoints and GraphQL transport.
- GraphQL Yoga exposes profile, catalogue, draft, submission, status and activity contracts.
- PostgreSQL stores prototype state through migrations and seeds.
- Zod and service modules own validation and workflow rules.
- Pino logs, correlation IDs, safe errors, CORS, rate limiting and security headers provide review-grade seams.

## Main Surfaces

| Surface | Purpose | Evidence |
| --- | --- | --- |
| `GET /health`, `/health/live`, `/health/ready` | Health and database readiness. | [health route](../backend/src/routes/health.ts), backend tests, [full-stack smoke](../scripts/full-stack-smoke.mjs). |
| `POST /graphql` | Platform data, drafts, submissions and reviewer status updates. | [schema.ts](../backend/src/graphql/schema.ts), [services](../backend/src/services). |
| `POST /uploads/supporting-documents` | Metadata-only supporting document policy. | [supportingDocuments.ts](../backend/src/routes/supportingDocuments.ts), [supporting document policy](../backend/src/policies/supportingDocumentPolicy.ts). |
| `GET /service-requests/:referenceNumber/summary/download` | Prototype text summary download. | [submissionSummaries.ts](../backend/src/routes/submissionSummaries.ts). |
| `GET /operations/outbox-events` | Reviewer/admin outbox summary. | [operations.ts](../backend/src/routes/operations.ts). |

## Server-Only GraphQL Boundary

The frontends intentionally do not call the backend from browser components. Next.js server code uses [backendClient.ts](../frontend/packages/services/src/server/backendClient.ts) and [backendServices.ts](../frontend/packages/services/src/server/backendServices.ts), then renders app pages from typed service responses.

This keeps internal backend origins, demo identity headers and privileged endpoints out of browser bundles. If a future SSQ product required browser Apollo Client, it should sit behind authenticated public GraphQL surfaces while internal service URLs remain server-side.

## Security Controls Implemented For Review

- Demo citizen and reviewer roles are explicit prototype identity, not real SSO/IAM.
- Reviewer-only operations are checked server-side.
- Backend validation owns write rules and returns user-safe errors.
- Correlation IDs connect logs and responses.
- CORS, rate limiting, request limits and security headers are configured for the review runtime.
- Guards block tracked secrets, generated deployment specs, browser backend-origin leaks and public prose drift.

## Production-Next Security Work

- Real identity, sessions, SSO/IAM and auditable authorisation.
- Private document storage, malware scanning, retention and privacy review.
- Threat modelling, penetration testing and full security assurance.
- Central log shipping, metrics, tracing, alerting and incident runbooks.
- Production queue/outbox workers with retry, replay and dead-letter controls.

## Verification

```bash
pnpm --dir backend test
pnpm --filter @ssq/services test
pnpm test:full-stack-smoke
pnpm guard:frontend-source
pnpm guard:browser-bundles
```
