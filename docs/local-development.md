# Local Development

This repository uses Docker Compose for local infrastructure.

## Runtime

- Node.js `22`
- pnpm `10.18.3`
- PostgreSQL `16`

## Environment

Safe local defaults are defined in `docker-compose.yml`.

Copy `.env.example` to `.env` only when you need to override local ports or database credentials. Do not commit `.env`.

## PostgreSQL

Start the database:

```bash
pnpm docker:up
```

Check the Compose configuration:

```bash
pnpm docker:config
```

Stop the local runtime:

```bash
pnpm docker:down
```

The database is exposed on host port `54329` by default to avoid clashing with a local PostgreSQL install.

Connection details:

- Host from the laptop: `localhost`
- Host from Compose services: `postgres`
- Port from the laptop: `54329`
- Port from Compose services: `5432`
- Database: `ssq_prototype`
- User: `ssq_app`

The `ssq-postgres-data` Docker volume persists database state across container restarts.

## App Placeholders

The backend and three frontend apps are declared as Compose placeholders under the `app-placeholders` profile. They are not used by the default database-only runtime yet.

Preview the full future service graph:

```bash
docker compose --profile app-placeholders config
```

The real backend and frontend containers will replace these placeholders as those packages are implemented.
