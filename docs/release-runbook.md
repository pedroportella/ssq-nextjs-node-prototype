# Release Handover Runbook

This runbook is the reviewer handover for the SSQ Next.js/Node prototype. Use it to review the live DigitalOcean deployment or to run the same stack locally.

DigitalOcean App Platform is review infrastructure for this prototype. It is not a Queensland Government production hosting claim.

Last verified: 2026-06-17.

## Live Review

Open the public frontend apps:

- Dashboard: https://ssq-dashboard-swgsm.ondigitalocean.app
- Seniors Card: https://ssq-seniors-card-lfzpt.ondigitalocean.app
- Rental Security Subsidy: https://ssq-rental-security-subsidy-kgbzf.ondigitalocean.app

The shared backend is configured server-side for these apps. Backend URLs, app IDs, generated deployment specs and operations endpoints are intentionally kept out of public reviewer docs.

Quick public status checks:

```bash
curl -i https://ssq-dashboard-swgsm.ondigitalocean.app/status
curl -i https://ssq-seniors-card-lfzpt.ondigitalocean.app/status
curl -i https://ssq-rental-security-subsidy-kgbzf.ondigitalocean.app/status
```

Expected result: each app returns HTTP `200` with `status: UP`.

Maintainers with the private backend review URL can also run the deployed full-stack smoke by setting:

```bash
SSQ_SMOKE_BACKEND_READY_URL=https://<private-backend-host>/health/ready \
SSQ_SMOKE_GRAPHQL_URL=https://<private-backend-host>/graphql \
SSQ_SMOKE_DASHBOARD_URL=https://ssq-dashboard-swgsm.ondigitalocean.app \
SSQ_SMOKE_SENIORS_CARD_URL=https://ssq-seniors-card-lfzpt.ondigitalocean.app \
SSQ_SMOKE_RENTAL_SECURITY_SUBSIDY_URL=https://ssq-rental-security-subsidy-kgbzf.ondigitalocean.app \
pnpm test:full-stack-smoke
```

## Local Review

Use this path to run the prototype with local Docker containers:

```bash
pnpm install
pnpm docker:build
pnpm docker:up:backend
pnpm test:full-stack-smoke
pnpm docker:down
```

The local runtime starts PostgreSQL, the backend API and the three standalone Next.js apps. Default local URLs are documented in `docs/local-development.md`.

If default host ports are already in use, either stop the conflicting local process before starting Compose or run the stack on alternate host ports:

```bash
BACKEND_PORT=7101 \
DASHBOARD_PORT=3100 \
SENIORS_CARD_PORT=3101 \
RENTAL_SECURITY_SUBSIDY_PORT=3102 \
SSQ_FRONTEND_DATA_SOURCE=backend \
docker compose up -d postgres backend dashboard seniors-card rental-security-subsidy
```

For frontend-only review without Docker or the backend, use the frontend-only smoke path documented in `docs/local-development.md`.

## Release Quality Checks

Run these before treating a branch as review-ready:

```bash
pnpm test:reviewer-evidence
pnpm guard:artifacts
pnpm build
pnpm guard:browser-bundles
pnpm guard:frontend-source
pnpm check
```

`pnpm test:reviewer-evidence` checks that the public five-minute path still has the required docs, screenshots, live frontend links, `/status` links, local Markdown targets and public-doc leakage safeguards.

`pnpm guard:browser-bundles` must run after production frontend builds because it scans generated `.next/static` assets for leaked backend-only configuration.

## Reviewer Evidence Checklist

Before sharing the prototype with a selection panel:

- Open the public frontend links in `docs/live-review-links.md`.
- Check the three public `/status` URLs.
- Read the README's "Role Fit In Five Minutes" path from top to bottom.
- Confirm the selection criteria map links each role criterion to evidence and caveats.
- Run `pnpm test:reviewer-evidence` to check required docs, screenshots, local Markdown links and public-doc leakage patterns.
- Run the release quality checks above when a branch needs a fresh local quality gate.

Latest local test command audit recorded on 2026-06-17: `pnpm test`, `pnpm test:e2e`, `pnpm test:e2e:mock`, `pnpm test:e2e:mock:dashboard`, `pnpm test:e2e:mock:seniors-card`, `pnpm test:e2e:mock:rental-security-subsidy`, `pnpm test:e2e:mock:headed`, `pnpm test:e2e:mock:rss-dashboard:headed`, `pnpm test:e2e:real`, `pnpm test:e2e:real:headed`, `pnpm test:e2e:real:rss-dashboard:headed`, `pnpm test:full-stack-smoke` and `pnpm test:reviewer-evidence` passed locally. `pnpm test` emitted the existing Dart Sass legacy JS API deprecation warnings during UI/app tests.

`pnpm test:visual` ran but failed all 14 current screenshot comparisons against stale approved baselines. Review the diffs and run `pnpm test:visual:update` only after intentionally accepting the visual changes. `pnpm test:e2e:report` and `pnpm test:visual:update` are helper commands rather than routine pass/fail checks.

If any command is skipped in a later pass, record why in the private handover note.

## What Is Real

- Three separately deployable Next.js frontend apps.
- Shared Node.js backend with Fastify, GraphQL, REST health endpoints and PostgreSQL.
- SQL migrations and deterministic seed data.
- Server-side frontend service layer for backend reads.
- Local Docker runtime for PostgreSQL, backend and frontend apps.
- DigitalOcean App Platform review deployment for all public apps.
- Backend-owned draft validation, submission flow, request activity, status transitions, summary download and metadata-only supporting document policy.
- Demo reviewer roles and citizen identity boundaries for the prototype.
- Correlation IDs, safe error responses, CORS allow-list configuration, simple local rate limiting and security headers.
- Guard scripts that block generated artifacts, local deployment specs and browser-visible backend secrets.

## What Is Simulated

- Identity is selected through prototype demo headers, not real SSO/IAM.
- Citizen and reviewer data is seeded demonstration data.
- Supporting document handling validates metadata only; it does not store binaries, scan malware or enforce retention.
- Submission summaries are plain text prototype downloads, not official receipts.
- Outbox events are persisted for review, but no production queue worker is attached.
- DigitalOcean uses review infrastructure and a review database posture, not hardened production infrastructure.
- Review roles demonstrate boundaries, but they are not a final auditable authorization policy.

## Production-Next

- Replace demo identity headers with real identity, session management, SSO/IAM and auditable authorization.
- Move from review database posture to production database operations, including backups, high availability, point-in-time restore, migration policy and credential rotation.
- Add private object storage, malware scanning, retention controls and privacy review for documents.
- Attach real queue publishing, retry policy, dead-letter handling and outbox processing.
- Add structured log shipping, metrics, tracing, alerting and operational runbooks.
- Complete security, privacy, accessibility, browser, performance and resilience review.
- Add custom domains, final TLS/certificate ownership, environment promotion controls and secret-management policy.

## Handover Notes

- Keep `.do/*.local.yml` and `.do/*.generated.yml` local only.
- Commit only `.do/*.template.yml` specs and reviewer-facing docs.
- Keep backend/admin/ops URLs and DigitalOcean app IDs in private operational notes.
- Use `docs/digitalocean-deployment.md` for deployment mechanics and `docs/live-review-links.md` for public frontend links.
- Use `docs/backend-production-readiness.md`, `docs/frontend-deployment-readiness.md`, `docs/operational-reliability-support-evidence.md` and `docs/aws-platform-mapping.md` for deeper readiness, support, platform and production-next notes.
