# ssq-nextjs-node-prototype

Queensland Government-style service portal prototype for SSQ/myQLD digital transaction workflows.

This repository will contain:

- `backend`: Node.js/TypeScript API for transaction definitions, drafts, submissions, status tracking and operational seams.
- `frontend`: three separately deployable Next.js apps for dashboard, Seniors Card and Rental Security Subsidy workflows.
- `docker`: local runtime and deployment support.
- `docs`: reviewer-facing architecture, runbook and release notes.

## Current State

This repository currently contains the initial project structure. Application implementation will be added incrementally.

## Runtime

- Node.js: `22`
- pnpm: `10.18.3`

## Setup

```bash
pnpm install
```

## Quality Guards

```bash
pnpm guard:artifacts
pnpm build
pnpm guard:browser-bundles
```

The guard scripts fail when generated artifacts, local env files, local databases, reports or generated DigitalOcean specs are tracked. Browser bundle guards run after app builds and check that frontend static assets do not expose private backend origins, database URLs or backend-only environment variable names.

Private deployment notes and generated DigitalOcean specs stay out of Git. Commit only safe templates and reviewer-facing documentation.

## Local Infrastructure

```bash
pnpm docker:config
pnpm docker:up
pnpm docker:down
```

The local Docker runtime starts PostgreSQL, the backend API and the three Next.js app containers. The backend applies database migrations and prototype seed data before starting. Each frontend app is built as a standalone Next.js container and receives the backend URL through server-side environment only.
The backend API is available on `http://localhost:7001` once the local runtime is up.
The frontend apps are available on:

- Dashboard: `http://localhost:3000`
- Seniors Card: `http://localhost:3001`
- Rental Security Subsidy: `http://localhost:3002`

See `docs/local-development.md` for local runtime details.

## Planned Apps

- `frontend/apps/dashboard`
- `frontend/apps/seniors-card`
- `frontend/apps/rental-security-subsidy`

Current app status endpoints:

- `frontend/apps/dashboard`: `GET http://localhost:3000/status`
- `frontend/apps/seniors-card`: `GET http://localhost:3001/status`
- `frontend/apps/rental-security-subsidy`: `GET http://localhost:3002/status`

Current shared frontend packages:

- `frontend/packages/services`
- `frontend/packages/ui-library`
- `frontend/packages/ui-tokens`
- `frontend/packages/ui-assets`
- `frontend/packages/utils`

The three apps import the shared theme through `@ssq/ui-library/theme.css`. The current frontend direction is QHDS as React wrappers in `@ssq/ui-library`; this repository no longer carries a local web-components package. Web-component exploration has been split out into the copied `ssq-web-components` repository so this prototype can stay smaller and focus on the Next.js app workflows. See `docs/frontend-architecture.md` for the active frontend architecture note.

Frontend apps consume backend-facing service helpers through `@ssq/services/server` so private backend configuration stays on the server side.

For frontend-only work, `@ssq/services/server` can run against typed mock data without Docker or the backend. Local development and tests default to mock data when `BACKEND_INTERNAL_URL` is absent; production-like runs require backend configuration unless mock mode is explicitly requested. Use `pnpm test:mock-smoke` to start all three apps in mock mode and verify that no backend/private GraphQL requests are made.

## Planned Backend

The backend is a production-shaped Node.js platform slice with Fastify, PostgreSQL, SQL migrations, prototype seed data, repository helpers, backend-owned readiness, database-backed transaction catalogue, GraphQL platform API, service request drafts, submission validation, simulated profile evidence, supporting document upload policy, request activity lifecycle, submission summary downloads, persisted outbox events, demo identity role boundaries, correlation/safe-error observability and room for broader safe operations endpoints.

Current seeded backend catalogue:

- dashboard
- seniors-card
- rental-security-subsidy

Current backend health endpoints:

- `GET /health`
- `GET /health/live`
- `GET /health/ready`: includes database reachability.

Current backend API endpoints:

- `POST /graphql`: platform data API for viewer/profile, feature flags, transaction catalogue, transaction schemas, service request drafts, validated draft submission, simulated profile evidence, service request status lifecycle, submitted-record review lists, paged service request query contracts, submission summary metadata, service requests and activity logs.
- `POST /uploads/supporting-documents`: metadata-only supporting document upload policy endpoint with size/type/category/ownership validation and production-next scanning/retention fields.
- `GET /service-requests/:referenceNumber/summary/download`: text submission summary download endpoint with owner checks, content type and `content-disposition`.
- `GET /operations/outbox-events`: prototype operations endpoint that summarises pending, processed and failed backend outbox events.

Local prototype identity can be selected with `X-SSQ-DEMO-ROLE` (`Citizen`, `ServiceOfficer`, `TeamLead` or `Admin`) and `X-SSQ-DEMO-SUBJECT`. Citizen identity defaults to `demo.customer@example.test`.

Backend responses preserve or generate `x-correlation-id`. Safe error responses include the correlation ID without exposing stack traces or raw exception details. Debug routes remain unavailable unless explicitly enabled outside production. The backend also supports configurable CORS allowed origins, simple local rate limiting and security response headers.

See `docs/backend-architecture.md` and `docs/backend-production-readiness.md` for reviewer-facing backend notes.
