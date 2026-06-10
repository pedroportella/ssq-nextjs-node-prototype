# Backend

Node.js/TypeScript API for the SSQ digital transaction prototype.

## Runtime

- Node.js `22`
- Fastify
- Pino
- Zod
- Vitest

## Commands

```bash
pnpm --dir backend dev
pnpm --dir backend db:migrate
pnpm --dir backend db:seed
pnpm --dir backend typecheck
pnpm --dir backend test
pnpm --dir backend build
```

## Docker

Build the backend container from the repository root:

```bash
pnpm docker:build
```

Start PostgreSQL and the backend API:

```bash
pnpm docker:up
```

## Health Endpoints

- `GET /health`: runtime health summary.
- `GET /health/live`: liveness probe.
- `GET /health/ready`: readiness probe with database reachability.

The local Docker backend runs migrations and seed data before starting the API. When running the backend directly, set `DATABASE_URL`, run `pnpm --dir backend db:migrate`, then run `pnpm --dir backend db:seed`.

## Persistence

The backend currently owns SQL migrations and seed data for:

- customer profile records;
- transaction definitions;
- transaction schemas;
- feature flags;
- service requests;
- service request events.

The seeded transaction catalogue includes dashboard, Seniors Card and Rental Security Subsidy entries. A transaction is startable only when its definition is enabled and its `transaction.<key>.enabled` feature flag is true.
