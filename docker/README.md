# Docker

Docker support starts with local infrastructure and grows into app containers as the backend and frontend packages are implemented.

Current services:

- `postgres`: local PostgreSQL 16 database with a persistent `ssq-postgres-data` volume.
- `backend`: Node.js API container built from `backend/Dockerfile`.
- `dashboard`: Next.js app container built from `frontend/apps/dashboard/Dockerfile`.
- `seniors-card`: Next.js app container built from `frontend/apps/seniors-card/Dockerfile`.
- `rental-security-subsidy`: Next.js app container built from `frontend/apps/rental-security-subsidy/Dockerfile`.

Common commands:

```bash
pnpm docker:config
pnpm docker:build
pnpm docker:up:backend
pnpm docker:down
```

Use `pnpm docker:up` when you intentionally want the frontend data source from your local `.env`. Use `pnpm docker:up:core` when you only need PostgreSQL and the backend API.

The full app backend-mode runtime connects frontend services to the backend API. After `pnpm docker:up:backend`, run:

```bash
pnpm test:full-stack-smoke
```

This checks backend readiness, frontend status endpoints, direct GraphQL reads and backend-rendered frontend pages.

This is local review infrastructure only. It is not Queensland Government production hosting.
