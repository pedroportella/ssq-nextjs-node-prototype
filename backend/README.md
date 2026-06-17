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

Optional local debug route:

```bash
DEBUG_ROUTES_ENABLED=true pnpm --dir backend dev
```

Useful hardening configuration:

- `CORS_ALLOWED_ORIGINS`: comma-separated allowed browser origins. Empty means no browser origins are allowed.
- `RATE_LIMIT_ENABLED`: defaults to `true`.
- `RATE_LIMIT_MAX`: requests per window, default `120`.
- `RATE_LIMIT_WINDOW_MS`: rate window in milliseconds, default `60000`.
- `DEBUG_ROUTES_ENABLED`: defaults to `false`; ignored in production.

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
- service request events;
- submission summaries;
- outbox events;
- supporting document metadata.

The seeded transaction catalogue includes dashboard, Seniors Card and Rental Security Subsidy entries. A transaction is startable only when its definition is enabled and its `transaction.<key>.enabled` feature flag is true.

Draft submission validates the stored payload against the seeded transaction schema subset before creating a submitted service request. Validation returns field-keyed errors for required fields, enum strings, date strings, booleans, numeric minimums and string arrays.

Submitted requests capture simulated profile evidence for transaction-declared prefill attributes. This evidence is marked `SIMULATED_PROFILE` and includes production-next metadata rather than claiming real Digital Identity integration.

Supporting document uploads are currently metadata-only for local review. The backend validates target ownership, transaction-specific category/person-bucket policy, file extension, MIME type, per-file size and per-person count/total-size limits, then records production-next scanning, private storage and retention fields.

Service request status changes are backend-owned. The current lifecycle supports `SUBMITTED -> UNDER_REVIEW`, `SUBMITTED -> WITHDRAWN`, `UNDER_REVIEW -> ACTION_REQUIRED`, `UNDER_REVIEW -> COMPLETED`, and `ACTION_REQUIRED -> UNDER_REVIEW` or `WITHDRAWN`, with each accepted transition recorded as an activity event.

Draft submission also generates a text submission summary for the submitted request. The summary is a prototype review artifact with metadata and payload context, not an official receipt or production document store.

Successful submission records pending outbox events for submitted request, summary-created, notification-requested and agency-review-requested integration seams. The outbox demonstrates persisted event-driven handoff points for review; it does not publish to a production queue.

## REST

Current REST surface:

- `POST /uploads/supporting-documents`: records validated supporting document metadata for a customer-owned draft or service request.
- `GET /service-requests/:referenceNumber/summary/download`: downloads the generated text submission summary for a customer-owned submitted request with `content-type` and `content-disposition` headers.
- `GET /operations/outbox-events`: summarises outbox event counts by event type and status for local operations review.

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
- paged service request connection with status/search/page/sort inputs and status counts;
- service request by reference;
- customer profile evidence by service request ID;
- submission summary by reference number;
- activity logs.

Current mutation surface:

- create service request draft;
- update service request draft;
- submit service request draft;
- update service request status.

GraphQL requests can provide `x-correlation-id` for trace continuity. Local prototype identity defaults to `demo.customer@example.test` and can be overridden with `x-demo-customer-email`.

Prototype role headers are also supported:

- `X-SSQ-DEMO-ROLE`: `Citizen`, `ServiceOfficer`, `TeamLead` or `Admin`.
- `X-SSQ-DEMO-SUBJECT`: demo subject identifier. For citizens this is the customer email.

Citizen role access is scoped to owned drafts, requests, uploads and summary downloads. Service officer, team lead and admin roles can read submitted service requests and update request status. Admin role is required for operations endpoints. These headers are local review controls only, not production authentication.

All backend responses preserve a supplied `x-correlation-id` or generate one when absent. Safe not-found and unhandled-error responses include the correlation ID and avoid stack traces or raw infrastructure details. Runtime logs redact common secret-bearing headers and payload/body fields.

`GET /debug/request` is available only when `DEBUG_ROUTES_ENABLED=true` and `NODE_ENV` is not `production`; it is unavailable by default.

Service request connection queries validate paging and sort inputs before reaching SQL. Supported sort fields are `createdAt`, `referenceNumber`, `status` and `transactionKey`; page size is capped at 50 for the prototype.

Transport hardening includes a configurable CORS allow-list, simple in-memory rate limiting, `nosniff`, frame, referrer and permissions-policy headers, and production-only HSTS.

See `../docs/backend-architecture.md` and `../docs/backend-production-readiness.md` for reviewer-facing architecture and production-next notes.
