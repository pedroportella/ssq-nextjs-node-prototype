# Frontend Deployment Readiness

The three Next.js frontend apps are buildable as production standalone apps while preserving the frontend-only mock runtime used by the prototype.

## Apps

- Dashboard: `@ssq/dashboard`, default port `3000`.
- Seniors Card: `@ssq/seniors-card`, default port `3001`.
- Rental Security Subsidy: `@ssq/rental-security-subsidy`, default port `3002`.

Each app has an app-local Dockerfile under `frontend/apps/<app>/Dockerfile`. The Dockerfiles build from the workspace root so workspace packages resolve normally, run the app-specific `next build`, then copy the Next.js standalone output into a runtime image.

## Runtime Mode

Frontend pages resolve data through the server-only service layer in `@ssq/services/server`.

- `SSQ_FRONTEND_DATA_SOURCE=mock` uses deterministic frontend mock data.
- `SSQ_FRONTEND_DATA_SOURCE=backend` requires `BACKEND_INTERNAL_URL` and uses the backend service adapters.
- Omitting `SSQ_FRONTEND_DATA_SOURCE` uses backend mode when `BACKEND_INTERNAL_URL` is present, otherwise local development falls back to mock mode.
- Production-like runs fail closed unless `BACKEND_INTERNAL_URL` is set or `SSQ_FRONTEND_DATA_SOURCE=mock` is explicit.

The prototype Compose runtime defaults `SSQ_FRONTEND_DATA_SOURCE=backend` for frontend services and passes `BACKEND_INTERNAL_URL` as a server-only integration setting. Use `SSQ_FRONTEND_DATA_SOURCE=mock` for frontend-only work and deterministic mock smoke checks.

## Public URLs

Cross-app navigation is configured with server-side public URL environment variables:

- `DASHBOARD_PUBLIC_URL`
- `SENIORS_CARD_PUBLIC_URL`
- `RENTAL_SECURITY_SUBSIDY_PUBLIC_URL`

These values are read on the server and used to build service catalogue links. They are public destinations, not backend origins.

## Server-Only Boundary

Do not expose backend/internal URLs to browser JavaScript.

- Use `BACKEND_INTERNAL_URL` only in server modules.
- Do not add `NEXT_PUBLIC_BACKEND_URL`.
- Do not fetch GraphQL directly from browser components.
- Keep backend calls behind `@ssq/services/server`.

The guard commands enforce this boundary:

```bash
pnpm guard:frontend-source
pnpm guard:browser-bundles
```

`guard:browser-bundles` requires production frontend builds first because it scans `.next/static` output.

## Build And Smoke Checks

Run production builds for the three apps:

```bash
pnpm --filter @ssq/dashboard build
pnpm --filter @ssq/seniors-card build
pnpm --filter @ssq/rental-security-subsidy build
```

Run the default dashboard mock browser QA suite:

```bash
pnpm test:mock-smoke
```

Run `pnpm test:mock-smoke:all` when the release check needs all three frontend apps.

For a visible browser pass, run the headed Playwright E2E command documented in [local development](local-development.md). The focused RSS flow verifies file upload, submitted status and Dashboard file links in Chromium.

For local backend-mode container smoke checks:

```bash
pnpm docker:build
pnpm docker:up:backend
pnpm test:full-stack-smoke
pnpm docker:down
```

The full-stack smoke validates backend readiness, all frontend status endpoints, direct GraphQL reads and backend-rendered frontend pages.

## DigitalOcean Review Templates

DigitalOcean App Platform templates for the three frontend apps live in `.do/`:

- `.do/ssq-dashboard.template.yml`
- `.do/ssq-seniors-card.template.yml`
- `.do/ssq-rental-security-subsidy.template.yml`

Use `docs/digitalocean-deployment.md` when preparing local deployment specs. Keep generated specs, live app IDs and backend URLs out of committed browser assets.
