# Local Development

This repository uses Docker Compose for local infrastructure.

## Runtime

- Node.js `22`
- pnpm `10.18.3`
- PostgreSQL `16`

## Environment

Safe local defaults are defined in `docker-compose.yml`.

Copy `.env.example` to `.env` only when you need to override local ports or database credentials. Do not commit `.env`.

## Local Runtime

Start PostgreSQL, the backend API and the three frontend apps in backend mode:

```bash
pnpm docker:up:backend
```

Use `pnpm docker:up` when you intentionally want the mode from your local `.env`.

Start only PostgreSQL and the backend API:

```bash
pnpm docker:up:core
```

Check the Compose configuration:

```bash
pnpm docker:config
```

Stop the local runtime:

```bash
pnpm docker:down
```

The backend is exposed on host port `7001` by default:

```bash
curl -i http://localhost:7001/health
```

The frontend apps expose `/status` on separate host ports:

```bash
curl -i http://localhost:3000/status
curl -i http://localhost:3001/status
curl -i http://localhost:3002/status
```

Frontend app containers receive `BACKEND_INTERNAL_URL` as a server-side environment variable pointing at the Compose backend service. The Compose runtime defaults `SSQ_FRONTEND_DATA_SOURCE=backend` so the dashboard and transaction apps render backend-backed data through the server-only frontend service layer. Do not add `NEXT_PUBLIC_BACKEND_URL` or browser-visible backend URL values.

Run the local full-stack smoke check after `pnpm docker:up:backend`:

```bash
pnpm test:full-stack-smoke
```

The smoke check verifies backend readiness, all three frontend `/status` endpoints, direct GraphQL profile/catalogue reads and backend-rendered dashboard/transaction pages.

The database is exposed on host port `54329` by default to avoid clashing with a local PostgreSQL install.

Connection details:

- Host from the laptop: `localhost`
- Host from Compose services: `postgres`
- Port from the laptop: `54329`
- Port from Compose services: `5432`
- Database: `ssq_prototype`
- User: `ssq_app`

The `ssq-postgres-data` Docker volume persists database state across container restarts.

## Frontend-Only Mock Runtime

Frontend app work can run without Docker, PostgreSQL or the backend API. The server-side frontend service layer defaults to mock data in local development and tests when `BACKEND_INTERNAL_URL` is not configured.

The root `.env` file can be used for frontend-only work. Load it in each terminal session before starting an app:

```bash
set -a
source .env
set +a
```

Then run the apps locally in three separate terminal tabs:

```bash
pnpm --filter @ssq/dashboard dev
pnpm --filter @ssq/seniors-card dev
pnpm --filter @ssq/rental-security-subsidy dev
```

Or run them without loading `.env` by keeping the mock runtime inline:

```bash
SSQ_FRONTEND_DATA_SOURCE=mock pnpm --filter @ssq/dashboard dev
SSQ_FRONTEND_DATA_SOURCE=mock pnpm --filter @ssq/seniors-card dev
SSQ_FRONTEND_DATA_SOURCE=mock pnpm --filter @ssq/rental-security-subsidy dev
```

Open the apps at:

```text
Dashboard: http://localhost:3000
Seniors Card: http://localhost:3001
Rental Security Subsidy: http://localhost:3002
```

Run the default frontend mock smoke check:

```bash
pnpm test:mock-smoke
```

The default smoke check starts only the dashboard in mock mode and verifies that it renders without backend or private GraphQL requests. Use the app-specific scripts when you need a narrower transaction app check or the complete three-app suite:

```bash
pnpm test:mock-smoke:dashboard
pnpm test:mock-smoke:seniors-card
pnpm test:mock-smoke:rental-security-subsidy
pnpm test:mock-smoke:all
```

Run visual baseline checks when reviewing QHDS-facing layout changes:

```bash
pnpm test:visual
pnpm test:visual:update
```

See `docs/qhds-visual-baselines.md` for the captured page list and screenshot update workflow.

In managed sandboxes, the command may need permission to bind the selected local app port: `3000`, `3001` or `3002`.

Use backend mode only for explicit integration checks:

```bash
SSQ_FRONTEND_DATA_SOURCE=backend BACKEND_INTERNAL_URL=http://localhost:7001 pnpm --filter @ssq/dashboard dev
```

Production-like runs fail safely unless `BACKEND_INTERNAL_URL` is configured or mock mode is explicitly requested.

Cross-app links use server-side public URL settings:

```bash
DASHBOARD_PUBLIC_URL=http://localhost:3000
SENIORS_CARD_PUBLIC_URL=http://localhost:3001
RENTAL_SECURITY_SUBSIDY_PUBLIC_URL=http://localhost:3002
```

## App Containers

The three frontend apps are built with app-local Dockerfiles:

- `frontend/apps/dashboard/Dockerfile`
- `frontend/apps/seniors-card/Dockerfile`
- `frontend/apps/rental-security-subsidy/Dockerfile`

Each Dockerfile builds from the workspace root, runs the relevant app build and copies the Next.js standalone output into a smaller runtime image.
