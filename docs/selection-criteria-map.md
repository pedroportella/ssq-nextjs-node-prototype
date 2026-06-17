# Selection Criteria Map

This page maps the SSQ prototype to the Digital Customer Principal Full-stack Developer role. It is a quick evidence map, not a production readiness claim.

## Review Path

1. Open the [live apps](live-review-links.md).
2. Scan the [README screenshots](../README.md#screenshots).
3. Review the evidence matrix below.
4. Use [release-runbook.md](release-runbook.md) for local setup and quality gates.

## Evidence Matrix

| Role need | Prototype evidence | Verification |
| --- | --- | --- |
| Government transaction platform thinking | Dashboard, Seniors Card and Rental Security Subsidy apps share one service request lifecycle and reviewer view. | Live apps, [README](../README.md), [release-runbook.md](release-runbook.md). |
| React, Next.js and TypeScript | App Router apps under [frontend/apps](../frontend/apps) and shared packages under [frontend/packages](../frontend/packages). | `pnpm check`, `pnpm build`. |
| SPA/SSR workflow design | Routes stay thin; server-rendered pages call [server services](../frontend/packages/services/src/server); containers own workflow composition. | [frontend-architecture.md](frontend-architecture.md). |
| Forms, validation and feature flags | Backend validation owns submit rules; transaction catalogue seeds define enabled services. | Backend tests, `pnpm test:full-stack-smoke`. |
| UI library, HTML, CSS and responsive design | QHDS-style React adapters cover layout, forms, navigation, alerts, tables, upload and status components. | [accessibility-and-ui-library-evidence.md](accessibility-and-ui-library-evidence.md), `pnpm test:e2e:mock`, `pnpm test:visual`. |
| REST and GraphQL integration | Fastify exposes GraphQL plus REST health, upload, operations and summary routes. Frontends call these through a server-only service layer. | [api-and-security-evidence.md](api-and-security-evidence.md), `pnpm --dir backend test`. |
| Apollo/GraphQL judgement | The prototype keeps GraphQL calls server-side instead of adding browser Apollo Client, so backend origins and demo identity headers stay out of browser bundles. | `pnpm guard:frontend-source`, `pnpm guard:browser-bundles`. |
| Node.js backend development | Node.js 22, Fastify, GraphQL Yoga, PostgreSQL, Zod, Pino and Vitest. | [backend-architecture.md](backend-architecture.md), backend tests. |
| Test automation | Vitest, Playwright mock and real E2E, visual baselines, full-stack smoke and reviewer-evidence smoke. | `pnpm test`, `pnpm test:e2e:mock`, `pnpm test:e2e:real`, `pnpm test:reviewer-evidence`. |
| GitHub and delivery discipline | CI workflow, release runbook, architecture notes, quality guards and production-next gaps are kept with the code. | [release-runbook.md](release-runbook.md), [.github/workflows/ci.yml](../.github/workflows/ci.yml). |
| AWS, Kubernetes and serverless awareness | Container boundaries are mapped to ECS/Fargate or EKS, RDS, Secrets Manager/SSM, CloudWatch, S3/KMS and SQS/EventBridge/Lambda. | [aws-platform-mapping.md](aws-platform-mapping.md). |
| Reliability, support and high-assurance awareness | Health/readiness, frontend status routes, correlation IDs, safe errors, CORS, rate limiting, security headers and documented gaps. | [operational-reliability-support-evidence.md](operational-reliability-support-evidence.md). |

## Honest Gaps

The review environment does not implement production AWS deployment, real identity, real document storage, production authorisation, high availability, alerting or full security/privacy assurance. Those are mapped as production-next work in the evidence docs and README.
