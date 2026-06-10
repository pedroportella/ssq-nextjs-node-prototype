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
- customer profile evidence;
- transaction definitions;
- transaction schemas;
- feature flags;
- service request drafts;
- service requests;
- service request events.
- supporting document metadata.

The seeded transaction catalogue includes dashboard, Seniors Card and Rental Security Subsidy entries. A transaction is startable only when its definition is enabled and its `transaction.<key>.enabled` feature flag is true.

Draft submission validates the stored payload against the seeded transaction schema subset before creating a submitted service request. Validation returns field-keyed errors for required fields, enum strings, date strings, booleans, numeric minimums and string arrays.

Submitted requests capture simulated profile evidence for transaction-declared prefill attributes. This evidence is marked `SIMULATED_PROFILE` and includes production-next metadata rather than claiming real Digital Identity integration.

Supporting document uploads are currently metadata-only for local review. The backend validates category, file extension, MIME type, size and target ownership, then records production-next scanning, private storage and retention fields.

Service request status changes are backend-owned. The current lifecycle supports `SUBMITTED -> UNDER_REVIEW`, `SUBMITTED -> WITHDRAWN`, `UNDER_REVIEW -> ACTION_REQUIRED`, `UNDER_REVIEW -> COMPLETED`, and `ACTION_REQUIRED -> UNDER_REVIEW` or `WITHDRAWN`, with each accepted transition recorded as an activity event.

## REST

Current REST write surface:

- `POST /uploads/supporting-documents`: records validated supporting document metadata for a customer-owned draft or service request.

## GraphQL

The platform API is exposed at `POST /graphql`.

Current query surface:

- viewer;
- customer profile;
- feature flags;
- transaction definitions;
- enabled transaction catalogue;
- transaction schema by key;
- service request drafts;
- service request draft by ID;
- service requests;
- service request by reference;
- customer profile evidence by service request ID;
- activity logs.

Current mutation surface:

- create service request draft;
- update service request draft;
- submit service request draft;
- update service request status.

GraphQL requests can provide `x-correlation-id` for trace continuity. Local prototype identity defaults to `demo.customer@example.test` and can be overridden with `x-demo-customer-email`.
