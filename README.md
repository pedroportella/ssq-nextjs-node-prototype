# SSQ Next.js + Node.js Prototype

Working Smart Services Queensland-style transaction prototype built with three Next.js apps, a shared Node.js/Fastify API and PostgreSQL-backed workflow state.

This is a review prototype only. It is not an official Queensland Government, Smart Service Queensland, myQLD or production Digital Transaction Platform system.

## Five-Minute Review

1. Open the [live review apps](docs/live-review-links.md).
2. Scan the screenshots below.
3. Use the [selection criteria map](docs/selection-criteria-map.md) for role fit.
4. Use the evidence notes only where needed:
   - [docs/api-and-security-evidence.md](docs/api-and-security-evidence.md)
   - [docs/operational-reliability-support-evidence.md](docs/operational-reliability-support-evidence.md)
   - [docs/aws-platform-mapping.md](docs/aws-platform-mapping.md)
   - [docs/accessibility-and-ui-library-evidence.md](docs/accessibility-and-ui-library-evidence.md)
5. Use the [release runbook](docs/release-runbook.md) to run or verify the stack.

## Live Apps

- Dashboard: https://ssq-dashboard-swgsm.ondigitalocean.app
- Seniors Card: https://ssq-seniors-card-lfzpt.ondigitalocean.app
- Rental Security Subsidy: https://ssq-rental-security-subsidy-kgbzf.ondigitalocean.app

DigitalOcean is review infrastructure, not a production hosting claim.

## Screenshots

| Service dashboard | Seniors Card application |
| --- | --- |
| ![SSQ service dashboard showing services and request activity](docs/screenshots/ssq-dashboard.png) | ![Seniors Card application landing page](docs/screenshots/ssq-seniors-card.png) |

| Seniors Card apply flow | Rental Security Subsidy application |
| --- | --- |
| ![Seniors Card apply form with validation feedback](docs/screenshots/ssq-seniors-card-apply.png) | ![Rental Security Subsidy application landing page](docs/screenshots/ssq-rental-security-subsidy.png) |

## What Is Real

- Three separately deployable Next.js apps: dashboard, Seniors Card and Rental Security Subsidy.
- Shared Fastify backend with GraphQL, REST health/upload/download endpoints and PostgreSQL.
- SQL migrations, seeded prototype data, service request lifecycle and activity history.
- Backend-owned validation, draft submission, status updates and document metadata policy.
- Server-only frontend service layer so browser bundles do not expose backend origins.
- Docker Compose runtime, GitHub Actions quality gate and DigitalOcean review deployment.
- Vitest, Playwright, visual checks and reviewer-evidence smoke coverage.

## What Is Simulated

- Demo identity headers replace real SSO/IAM.
- Seeded citizen and reviewer data replace real citizen records.
- Supporting document handling stores metadata only, not file binaries.
- Outbox events are persisted, but no production worker or queue is attached.
- Security, privacy, high availability and accessibility sign-off remain production-next work.

## Run Locally

```bash
pnpm install
pnpm docker:build
pnpm docker:up:backend
pnpm test:full-stack-smoke
pnpm test:e2e:real
pnpm docker:down
```

Local URLs:

- Backend API: `http://localhost:7001`
- Dashboard: `http://localhost:3300`
- Seniors Card: `http://localhost:3001`
- Rental Security Subsidy: `http://localhost:3002`

For frontend-only work, use:

```bash
pnpm test:e2e:mock
```

More setup detail is in [local development](docs/local-development.md).

## Main Checks

```bash
pnpm test:reviewer-evidence
pnpm guard:artifacts
pnpm guard:terminology
pnpm build
pnpm guard:browser-bundles
pnpm guard:frontend-source
pnpm check
```

## Production Next

- Replace demo identity with real sessions, SSO/IAM and auditable authorisation.
- Add production database operations: backups, restore drills, credential rotation and high availability.
- Add private storage, malware scanning, retention and privacy review for documents.
- Attach queue processing, retry policy and dead-letter handling to outbox events.
- Add log shipping, metrics, tracing, alerting and support runbooks.
- Complete security, privacy, accessibility, performance and resilience assurance.
