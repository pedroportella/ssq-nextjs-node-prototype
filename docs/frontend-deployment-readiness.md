# Frontend Deployment Readiness

F20 makes the three Next.js frontend apps buildable as production standalone apps while preserving the frontend-only mock runtime used by the prototype.

## Apps

- Dashboard: `@ssq/dashboard`, default port `3000`.
- Seniors Card: `@ssq/seniors-card`, default port `3001`.
- Rental Security Subsidy: `@ssq/rental-security-subsidy`, default port `3002`.

Each app has an app-local Dockerfile under `frontend/apps/<app>/Dockerfile`. The Dockerfiles build from the workspace root so workspace packages resolve normally, run the app-specific `next build`, then copy the Next.js standalone output into a runtime image.

## Runtime Mode

Frontend pages resolve data through the server-only service layer in `@ssq/services/server`.

- `SSQ_FRONTEND_DATA_SOURCE=mock` uses deterministic frontend mock data.
- `SSQ_FRONTEND_DATA_SOURCE=backend` requires `BACKEND_INTERNAL_URL` and uses backend adapters where implemented.
- Omitting `SSQ_FRONTEND_DATA_SOURCE` uses backend mode when `BACKEND_INTERNAL_URL` is present, otherwise local development falls back to mock mode.
- Production-like runs fail closed unless `BACKEND_INTERNAL_URL` is set or `SSQ_FRONTEND_DATA_SOURCE=mock` is explicit.

The current prototype Compose runtime sets `SSQ_FRONTEND_DATA_SOURCE=mock` for frontend services because the end-to-end workflow backend adapters are not complete yet. `BACKEND_INTERNAL_URL` remains present as a server-only integration setting for later backend-mode checks.

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

Run the mock browser QA suite:

```bash
pnpm test:mock-smoke
```

For container status checks:

```bash
pnpm docker:build
pnpm docker:up
curl -i http://localhost:3000/status
curl -i http://localhost:3001/status
curl -i http://localhost:3002/status
pnpm docker:down
```

Status endpoints are intentionally lightweight and validate container readiness without requiring workflow backend adapters.
