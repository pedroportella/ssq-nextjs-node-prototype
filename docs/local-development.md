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

Start PostgreSQL, the backend API and the three frontend apps:

```bash
pnpm docker:up
```

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

Frontend app containers receive `BACKEND_INTERNAL_URL` as a server-side environment variable pointing at the Compose backend service. Do not add `NEXT_PUBLIC_BACKEND_URL` or browser-visible backend URL values.

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

Run the apps locally:

```bash
SSQ_FRONTEND_DATA_SOURCE=mock pnpm --filter @ssq/dashboard dev
SSQ_FRONTEND_DATA_SOURCE=mock pnpm --filter @ssq/seniors-card dev
SSQ_FRONTEND_DATA_SOURCE=mock pnpm --filter @ssq/rental-security-subsidy dev
```

Run the frontend mock smoke check:

```bash
pnpm test:mock-smoke
```

The smoke check starts all three Next.js apps in mock mode and verifies that their landing pages render without backend or private GraphQL requests. In managed sandboxes, the command may need permission to bind local ports `3000`, `3001` and `3002`.

Use backend mode only for explicit integration checks:

```bash
SSQ_FRONTEND_DATA_SOURCE=backend BACKEND_INTERNAL_URL=http://localhost:7001 pnpm --filter @ssq/dashboard dev
```

Production-like runs fail safely unless `BACKEND_INTERNAL_URL` is configured or mock mode is explicitly requested.

## App Containers

The three frontend apps are built with app-local Dockerfiles:

- `frontend/apps/dashboard/Dockerfile`
- `frontend/apps/seniors-card/Dockerfile`
- `frontend/apps/rental-security-subsidy/Dockerfile`

Each Dockerfile builds from the workspace root, runs the relevant app build and copies the Next.js standalone output into a smaller runtime image.
