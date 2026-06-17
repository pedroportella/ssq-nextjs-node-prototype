# Backend Architecture

Production-shaped Node.js prototype backend for SSQ-style service request workflows. It is not a production identity, document, queue or agency-integration platform.

## Shape

- Fastify owns HTTP routing, health probes, REST endpoints and GraphQL transport.
- PostgreSQL owns durable prototype state through SQL migrations and seed data.
- GraphQL exposes profile, catalogue, draft, submission, status, activity and query contracts.
- REST handles health, supporting document metadata, submission summary downloads, debug and operations surfaces.

## Layers

- Routes/resolvers coordinate transport, demo identity, responses and errors.
- Services own validation, workflow rules, activity history, outbox events and document policy.
- Repositories own SQL access.
- Policies centralise rules that must be shared by routes, services and tests.

## Boundaries

- Demo headers represent prototype citizen/reviewer identity only.
- Backend validation is authoritative for writes.
- Supporting document upload is metadata-only.
- Outbox events are persisted to show integration shape, but no production worker is attached.
- Correlation IDs, safe errors, CORS, rate limiting and security headers are implemented for review.

## Verify

```bash
pnpm --dir backend test
pnpm --dir backend typecheck
pnpm test:full-stack-smoke
```
