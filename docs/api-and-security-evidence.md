# API And Security Evidence

This note maps the SSQ prototype backend/API, GraphQL integration, authorization boundary and security controls to reviewer evidence.

It is evidence for a review prototype, not a production security assurance claim. The prototype uses demo identity headers and seeded data only.

## Runtime Shape

- Fastify owns HTTP routing, health probes, REST upload/download endpoints and GraphQL transport.
- GraphQL Yoga exposes platform data contracts for customer profile, transaction catalogue, drafts, submissions, status, activity and query contracts.
- PostgreSQL stores prototype state through SQL migrations and deterministic seeds.
- Zod and service-layer logic own validation and workflow rules.
- Pino logging, correlation IDs, safe errors, CORS, rate limiting and security headers provide review-grade operational seams.

Primary references:

- [Backend architecture](backend-architecture.md)
- [Backend production readiness](backend-production-readiness.md)
- [GraphQL schema](../backend/src/graphql/schema.ts)
- [Backend services](../backend/src/services)
- [Backend routes](../backend/src/routes)

## REST Surfaces

| Surface | Purpose | Evidence |
| --- | --- | --- |
| `GET /health` | Runtime health summary. | [health route](../backend/src/routes/health.ts), [app tests](../backend/src/app.test.ts). |
| `GET /health/live` | Liveness probe. | [health route](../backend/src/routes/health.ts), [app tests](../backend/src/app.test.ts). |
| `GET /health/ready` | Readiness probe with database reachability. | [health route](../backend/src/routes/health.ts), [app tests](../backend/src/app.test.ts), [full-stack smoke](../scripts/full-stack-smoke.mjs). |
| `POST /uploads/supporting-documents` | Records metadata-only supporting document uploads with type, size, category and ownership policy. | [supportingDocuments.ts](../backend/src/routes/supportingDocuments.ts), [supportingDocuments.test.ts](../backend/src/routes/supportingDocuments.test.ts), [supporting document policy](../backend/src/policies/supportingDocumentPolicy.ts). |
| `GET /service-requests/:referenceNumber/summary/download` | Downloads a customer-owned prototype text submission summary. | [submissionSummaries.ts](../backend/src/routes/submissionSummaries.ts), [submissionSummaries.test.ts](../backend/src/routes/submissionSummaries.test.ts). |
| `GET /operations/outbox-events` | Admin-only operational summary of persisted outbox events. | [operations.ts](../backend/src/routes/operations.ts), [operations.test.ts](../backend/src/routes/operations.test.ts). |
| `GET /debug/request` | Disabled-by-default debug route available only when explicitly enabled outside production. | [debug.ts](../backend/src/routes/debug.ts), [app tests](../backend/src/app.test.ts). |

## GraphQL Surfaces

GraphQL is exposed at `POST /graphql`.

Representative read query:

```graphql
query ReviewerProfileAndCatalogue {
  platform { correlationId demoRole demoSubject }
  viewer { email givenName familyName }
  customerProfile {
    attributes { key value }
    serviceRequests { referenceNumber transactionKey status }
  }
  transactionCatalogue {
    definition { key label status }
    schemaVersion
    featureEnabled
  }
}
```

Representative draft/submit mutation flow:

```graphql
mutation CreateDraft($input: CreateServiceRequestDraftInput!) {
  createServiceRequestDraft(input: $input) {
    ok
    draft { id transactionKey currentStep payload }
    error { code message }
  }
}
```

```graphql
mutation SubmitDraft($input: SubmitServiceRequestInput!) {
  submitServiceRequest(input: $input) {
    ok
    serviceRequest { referenceNumber status transactionKey }
    fieldErrors { field message }
    error { code message }
  }
}
```

Representative reviewer status update:

```graphql
mutation ReviewStatus($input: UpdateServiceRequestStatusInput!) {
  updateServiceRequestStatus(input: $input) {
    ok
    serviceRequest { referenceNumber status }
    error { code message }
  }
}
```

GraphQL coverage is in [graphqlRoute.test.ts](../backend/src/graphql/graphqlRoute.test.ts). The tests cover seeded profile/catalogue reads, missing identities, customer ownership, supporting document reads, submitted-record reviewer access, paged query contracts, invalid query validation, draft create/update/resume, submission validation, submission summaries, status transitions and activity projection.

## Server-Only GraphQL And Apollo Decision

The frontend does not call GraphQL from browser components. All backend GraphQL access goes through the server-only frontend service layer:

- [backendClient.ts](../frontend/packages/services/src/server/backendClient.ts)
- [backendServices.ts](../frontend/packages/services/src/server/backendServices.ts)
- [runtimeConfig.ts](../frontend/packages/services/src/server/runtimeConfig.ts)

This is intentional for the review prototype:

- backend/internal origins stay out of browser JavaScript;
- demo identity headers stay server-side;
- Next.js SSR can render customer workflows through stable service contracts;
- browser bundles can be scanned for backend URL leakage.

The guard commands enforce this boundary:

```bash
pnpm guard:frontend-source
pnpm guard:browser-bundles
```

If SSQ required browser Apollo Client for a future authenticated surface, the adoption path would be:

- expose only public, authenticated GraphQL operations to the browser;
- keep internal backend URLs, privileged headers and operations endpoints server-side;
- wrap Apollo Client behind the existing `@ssq/services` contracts so app pages do not depend directly on transport details;
- preserve browser-bundle and source guards for backend/internal URL leakage.

## Demo Identity And Authorization Matrix

Demo identity is selected through headers:

- `X-SSQ-DEMO-ROLE`: `Citizen`, `ServiceOfficer`, `TeamLead` or `Admin`.
- `X-SSQ-DEMO-SUBJECT`: demo subject identifier.
- `x-demo-customer-email`: legacy citizen fallback.

Unknown or missing roles resolve to `Citizen`, which is the safest demo role. This is implemented in [demoIdentity.ts](../backend/src/auth/demoIdentity.ts).

| Demo role | Allowed in prototype | Blocked or limited | Evidence |
| --- | --- | --- | --- |
| Citizen | Own profile, own drafts, own service requests, own supporting documents, own submission summaries, create/update/submit own drafts. | Cannot read submitted queue, cannot update status, cannot read admin operations. | [schema.ts](../backend/src/graphql/schema.ts), [graphqlRoute.test.ts](../backend/src/graphql/graphqlRoute.test.ts), [supportingDocuments.test.ts](../backend/src/routes/supportingDocuments.test.ts), [submissionSummaries.test.ts](../backend/src/routes/submissionSummaries.test.ts), [operations.test.ts](../backend/src/routes/operations.test.ts). |
| ServiceOfficer | Read submitted requests, query submitted records, read service request by reference, update status. | Cannot manage citizen drafts. Cannot read admin operations. | [schema.ts](../backend/src/graphql/schema.ts), [graphqlRoute.test.ts](../backend/src/graphql/graphqlRoute.test.ts). |
| TeamLead | Same submitted-record access pattern as ServiceOfficer in the demo boundary. | Cannot manage citizen drafts. Cannot read admin operations. | [demoIdentity.ts](../backend/src/auth/demoIdentity.ts), [schema.ts](../backend/src/graphql/schema.ts). |
| Admin | Submitted-record access plus operations outbox summary. | Still not a production IAM/RBAC role. | [operations.ts](../backend/src/routes/operations.ts), [operations.test.ts](../backend/src/routes/operations.test.ts). |
| Unknown or missing role | Falls back to Citizen. Missing customer identities return safe nulls or empty arrays. | No elevated access. | [demoIdentity.ts](../backend/src/auth/demoIdentity.ts), [graphqlRoute.test.ts](../backend/src/graphql/graphqlRoute.test.ts). |

## Service Request Operation Matrix

| Operation | Prototype role owner | Validation owner | Persistence owner | Test coverage | Production-next auth/audit requirement |
| --- | --- | --- | --- | --- | --- |
| Profile and viewer reads | Citizen only. Non-citizens receive nulls. | GraphQL resolver role check. | `PrototypeRepository` customer/profile methods. | [graphqlRoute.test.ts](../backend/src/graphql/graphqlRoute.test.ts). | Replace demo headers with real session/IAM identity and auditable customer scoping. |
| Transaction catalogue and schema reads | Public to prototype roles. Feature flags control startability. | `TransactionCatalogueService`. | `transaction_definitions`, `transaction_schemas`, `feature_flags`. | [transactionCatalogueService.test.ts](../backend/src/services/transactionCatalogueService.test.ts), [graphqlRoute.test.ts](../backend/src/graphql/graphqlRoute.test.ts). | Apply production entitlement and release-management policy if catalogue visibility becomes role-specific. |
| Draft list/read/create/update | Citizen-owned. | GraphQL role checks and `DraftLifecycleService`. | `service_request_drafts`. | [draftLifecycleService.test.ts](../backend/src/services/draftLifecycleService.test.ts), [graphqlRoute.test.ts](../backend/src/graphql/graphqlRoute.test.ts). | Real user/session identity, draft ownership audit and save-event audit trail. |
| Submit draft | Citizen-owned. | `SubmissionLifecycleService` and [submissionValidation.ts](../backend/src/services/submissionValidation.ts). | `service_requests`, events, evidence, summaries, outbox. | [submissionLifecycleService.test.ts](../backend/src/services/submissionLifecycleService.test.ts), [graphqlRoute.test.ts](../backend/src/graphql/graphqlRoute.test.ts). | Auditable submission identity, non-repudiation, receipt policy and agency handoff controls. |
| Citizen service request list/query/read | Citizen-owned. | Resolver role and customer lookup. | `service_requests`. | [graphqlRoute.test.ts](../backend/src/graphql/graphqlRoute.test.ts), [prototypeRepository.test.ts](../backend/src/repositories/prototypeRepository.test.ts). | Real authorization policy, row-level ownership checks and audit trails. |
| Submitted service request queue/query/read | ServiceOfficer, TeamLead, Admin. | Resolver role checks and query validation. | `service_requests`. | [graphqlRoute.test.ts](../backend/src/graphql/graphqlRoute.test.ts), [serviceRequestStatusLifecycleService.test.ts](../backend/src/services/serviceRequestStatusLifecycleService.test.ts). | Real staff IAM/RBAC/ABAC, team/agency scoping and operational read audit. |
| Status transition | ServiceOfficer, TeamLead, Admin. | `ServiceRequestStatusLifecycleService`. | `service_requests`, `service_request_events`, `outbox_events`. | [serviceRequestStatusLifecycleService.test.ts](../backend/src/services/serviceRequestStatusLifecycleService.test.ts), [graphqlRoute.test.ts](../backend/src/graphql/graphqlRoute.test.ts). | Audited officer identity, reason capture policy, notification policy and segregation-of-duties review. |
| Supporting document metadata upload | Citizen-owned draft/request. | `SupportingDocumentUploadService` and [supportingDocumentPolicy.ts](../backend/src/policies/supportingDocumentPolicy.ts). | `supporting_documents`. | [supportingDocumentUploadService.test.ts](../backend/src/services/supportingDocumentUploadService.test.ts), [supportingDocuments.test.ts](../backend/src/routes/supportingDocuments.test.ts). | Private object storage, malware scanning, retention, privacy review and real file authorization. |
| Supporting document metadata read | Citizen-owned draft/request. | Resolver checks customer ownership before listing documents. | `supporting_documents`. | [graphqlRoute.test.ts](../backend/src/graphql/graphqlRoute.test.ts). | Real document authorization policy, access audit and retention controls. |
| Submission summary read/download | Citizen-owned submitted request. | Resolver/route customer ownership lookup. | `submission_summaries`. | [graphqlRoute.test.ts](../backend/src/graphql/graphqlRoute.test.ts), [submissionSummaries.test.ts](../backend/src/routes/submissionSummaries.test.ts). | Official receipt policy, signed download links if needed, retention and audit trails. |
| Activity logs and customer profile evidence reads | Prototype support reads by service request id. | Current prototype resolver delegates to repository by id. | `service_request_events`, `customer_profile_evidence`. | [graphqlRoute.test.ts](../backend/src/graphql/graphqlRoute.test.ts) covers projection after submission/status change. | Must be scoped by customer/staff role and audited before production; this is intentionally a production-next gap. |
| Outbox operations summary | Admin only. | REST route role check. | `outbox_events`. | [operations.test.ts](../backend/src/routes/operations.test.ts). | Real operations IAM, audit logs, queue visibility policy and alerting integration. |

## Security Controls Implemented For Review

| Control | Evidence |
| --- | --- |
| Correlation IDs | [observability.ts](../backend/src/plugins/observability.ts), [app tests](../backend/src/app.test.ts), [full-stack smoke](../scripts/full-stack-smoke.mjs). |
| Safe REST errors | [observability.ts](../backend/src/plugins/observability.ts), not-found/error tests in [app.test.ts](../backend/src/app.test.ts). |
| Redacted logs | [logger.ts](../backend/src/logger.ts). |
| CORS allow-list | [config.ts](../backend/src/config.ts), [app.test.ts](../backend/src/app.test.ts). |
| Simple in-memory rate limiting | [hardening.ts](../backend/src/plugins/hardening.ts), [app.test.ts](../backend/src/app.test.ts). |
| Security response headers | [hardening.ts](../backend/src/plugins/hardening.ts), [app.test.ts](../backend/src/app.test.ts). |
| Debug route disabled by default | [debug.ts](../backend/src/routes/debug.ts), [app.test.ts](../backend/src/app.test.ts). |
| Browser/backend URL leak guards | [quality guards](../scripts/quality-guards.mjs), [frontend deployment readiness](frontend-deployment-readiness.md). |
| Artifact and local spec guards | [quality guards](../scripts/quality-guards.mjs). |

## Production-Next Security Work

Before any real citizen or agency data could be used, this prototype would need:

- real myQLD/QIB/SSO session integration;
- auditable authorization policy for citizens, staff, teams, agencies and operations users;
- row-level or policy-enforced data ownership checks;
- operational read and status-change audit trails;
- private document storage, malware scanning, retention enforcement and privacy review;
- production-grade rate limiting and abuse controls backed by shared infrastructure;
- structured log shipping, metrics, tracing and alerting;
- threat modelling, privacy impact assessment, penetration testing and accessibility review;
- deployment environment promotion controls, secret rotation and certificate/domain ownership.

## Verification Commands

Backend checks:

```bash
pnpm --dir backend typecheck
pnpm --dir backend test
```

Server-only frontend boundary:

```bash
pnpm guard:frontend-source
pnpm guard:browser-bundles
```

Full-stack smoke when the local or review backend is available:

```bash
pnpm test:full-stack-smoke
```
