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
- `frontend/packages/web-components`

The three apps import the shared theme through `@ssq/ui-library/theme.css`. The current theme is a prototype foundation for later QHDS/QGDS adapter work.

Frontend apps consume backend-facing service helpers through `@ssq/services/server` so private backend configuration stays on the server side.

## Planned Backend

The backend is a production-shaped Node.js platform slice with Fastify, PostgreSQL, SQL migrations, prototype seed data, repository helpers, backend-owned readiness, database-backed transaction catalogue, GraphQL platform API, service request drafts, submission validation, simulated profile evidence, supporting document upload policy, request activity lifecycle and room for submission summaries, outbox events and safe operations endpoints.

Current seeded backend catalogue:

- dashboard
- seniors-card
- rental-security-subsidy

Current backend health endpoints:

- `GET /health`
- `GET /health/live`
- `GET /health/ready`: includes database reachability.

Current backend API endpoint:

- `POST /graphql`: platform data API for viewer/profile, feature flags, transaction catalogue, transaction schemas, service request drafts, validated draft submission, simulated profile evidence, service request status lifecycle, service requests and activity logs.
- `POST /uploads/supporting-documents`: metadata-only supporting document upload policy endpoint with size/type/category/ownership validation and production-next scanning/retention fields.
