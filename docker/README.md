# Docker

Docker support starts with local infrastructure and grows into app containers as the backend and frontend packages are implemented.

Current services:

- `postgres`: local PostgreSQL 16 database with a persistent `ssq-postgres-data` volume.
- `backend`: Node.js API container built from `backend/Dockerfile`.
- `dashboard`: placeholder service under the `app-placeholders` profile.
- `seniors-card`: placeholder service under the `app-placeholders` profile.
- `rental-security-subsidy`: placeholder service under the `app-placeholders` profile.

Common commands:

```bash
pnpm docker:config
pnpm docker:build
pnpm docker:up
pnpm docker:down
```

This is local review infrastructure only. It is not Queensland Government production hosting.
