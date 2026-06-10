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

## Health Endpoints

- `GET /health`: runtime health summary.
- `GET /health/live`: liveness probe.
- `GET /health/ready`: readiness probe.

The current readiness probe confirms the API runtime is configured and bootable. Database readiness will be added with the persistence foundation.
