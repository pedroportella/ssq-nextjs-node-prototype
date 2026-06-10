# Backend Architecture

This backend is a production-shaped prototype for SSQ-style digital transaction workflows. It is not an official government platform and does not claim production identity, authorization, document storage, queueing or agency integration.

## Runtime Shape

- Fastify owns HTTP routing, health probes, REST upload/download endpoints and GraphQL transport.
- PostgreSQL owns durable prototype state through SQL migrations and seed data.
- GraphQL exposes platform data contracts for viewer/profile, catalogue, drafts, submissions, lifecycle, activity and query contracts.
- REST is used where HTTP semantics are a better fit: health, supporting document metadata upload, submission summary download, debug and operations endpoints.

## Layers

- Routes and resolvers coordinate transport, identity headers, response shape and service calls.
- Services own workflow rules such as draft lifecycle, submission validation, status transitions, summary generation, outbox creation and upload policy.
- Repository methods own SQL access and mapping from rows to backend records.
- Migrations own schema evolution. Seeds own prototype catalogue, flags and demo customer data.

## Identity Boundary

Local review identity is selected by headers:

- `X-SSQ-DEMO-ROLE`: `Citizen`, `ServiceOfficer`, `TeamLead` or `Admin`.
- `X-SSQ-DEMO-SUBJECT`: demo subject identifier. For citizens this is a customer email.
- `x-demo-customer-email`: legacy citizen fallback.

Citizen access is scoped to owned drafts, requests, uploads and summary downloads. Service officer, team lead and admin roles can read submitted records and update request status. Admin is required for operations endpoints. These controls are prototype-only and are not production authentication, SSO, IAM, RBAC or row-level security.

## Operational Seams

- `x-correlation-id` is preserved when supplied and generated when absent.
- Safe REST errors include the correlation ID and avoid stack traces.
- Runtime logs redact common secret-bearing headers and payload/body fields.
- Pending outbox events demonstrate event-driven handoff points without a real broker.
- `GET /operations/outbox-events` summarises outbox counts for admin review.
- `GET /debug/request` is disabled by default and can only be enabled outside production.

## Query Contracts

Service request connection queries support status filtering, lightweight search, validated paging, allowlisted sorting, total counts and status counts. Existing simple list fields remain for compatibility.
