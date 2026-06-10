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

The local Docker runtime currently starts PostgreSQL. Backend and frontend app containers are declared as placeholders and will be implemented as the application packages are added.

See `docs/local-development.md` for local runtime details.

## Planned Apps

- `frontend/apps/dashboard`
- `frontend/apps/seniors-card`
- `frontend/apps/rental-security-subsidy`

## Planned Backend

The backend will be a production-shaped Node.js platform slice with Fastify, GraphQL, PostgreSQL, backend-owned validation, upload policy, activity events, submission summaries, outbox events and safe operations endpoints.
