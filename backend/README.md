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
- `GET /health/ready`: readiness probe.

The current readiness probe confirms the API runtime is configured and bootable. Database readiness will be added with the persistence foundation.
