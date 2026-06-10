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
pnpm docker:up
pnpm docker:down
```

Use `pnpm docker:up:core` when you only need PostgreSQL and the backend API.

This is local review infrastructure only. It is not Queensland Government production hosting.
