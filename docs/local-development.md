# Local Development

This repository uses Docker Compose for local infrastructure.

## Runtime

- Node.js `22`
- pnpm `10.18.3`
- PostgreSQL `16`

## Environment

Safe local defaults are defined in `docker-compose.yml`. Optional local override values are documented in `.env.example`; keep any machine-specific override file untracked.

## Local Runtime

Start PostgreSQL, the backend API and the three frontend apps in backend mode:

```bash
pnpm docker:up:backend
```

Use `pnpm docker:up` when you intentionally want the mode from your local shell environment.

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

Run the browser E2E suite against the same Docker-backed stack:

```bash
pnpm test:e2e:real
```

The real E2E command starts the backend-mode Compose runtime, waits for backend and frontend health, drives Chromium through the dashboard and transaction apply pages, posts supporting-document metadata to the real backend API and verifies the backend GraphQL record.

For a visible real-backend pass focused on Rental Security Subsidy submission and Dashboard visibility:

```bash
pnpm test:e2e:real:rss-dashboard:headed
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

## Frontend-Only Mock Runtime

Frontend app work can run without Docker, PostgreSQL or the backend API. The server-side frontend service layer defaults to mock data in local development and tests when `BACKEND_INTERNAL_URL` is not configured.

Run the apps locally in three separate terminal tabs:

```bash
pnpm --filter @ssq/dashboard dev
pnpm --filter @ssq/seniors-card dev
pnpm --filter @ssq/rental-security-subsidy dev
```

Or keep the mock runtime explicit inline:

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

Run the default frontend mock E2E suite:

```bash
pnpm test:e2e
```

`pnpm test:e2e` is an alias for `pnpm test:e2e:mock`. It starts all three Next.js apps in mock mode and runs the Playwright browser suite without Docker, PostgreSQL or the backend API.

Use the focused mock aliases when you need a narrower app check:

```bash
pnpm test:e2e:mock:dashboard
pnpm test:e2e:mock:seniors-card
pnpm test:e2e:mock:rental-security-subsidy
```

Run a headed Playwright E2E flow when you want to watch Chromium drive the app. This command opens Rental Security Subsidy, clicks the Start application entry point, stages the mock evidence files, submits the record, opens Dashboard and verifies the RSS record and file links:

```bash
pnpm test:e2e:mock:rss-dashboard:headed
```

For a headed run of the complete mock smoke suite across all frontend apps:

```bash
pnpm test:e2e:mock:headed
```

Run the heavier workflow scenario matrix when you want SC/RSS field combinations, evidence validation limits and dashboard/summary checks without adding runtime to the default smoke gate:

```bash
pnpm test:e2e:scenarios
pnpm test:e2e:scenarios:seniors-card
pnpm test:e2e:scenarios:rental-security-subsidy
```

Use the headed scenario suite when you want to watch Chromium drive the matrix:

```bash
pnpm test:e2e:scenarios:headed
```

The mock E2E Playwright config starts the selected Next.js apps automatically. In managed sandboxes, headed runs may need permission to bind the selected local app ports: `3000`, `3001` or `3002`.

Run visual baseline checks when reviewing QHDS-facing layout changes:

```bash
pnpm test:visual
pnpm test:visual:update
```

Run only the Dashboard UI Library showcase visual baselines:

```bash
pnpm test:visual:showcase
pnpm test:visual:showcase:update
```

See `docs/qhds-visual-baselines.md` for the captured page list and screenshot update workflow.

## Test Command Audit

Verified locally on 2026-06-17:

| Command | Result | Notes |
| --- | --- | --- |
| `pnpm test` | Passed | Workspace Vitest suite passed; Dart Sass legacy JS API deprecation warnings are existing noise. |
| `pnpm test:e2e` | Passed | Alias for `pnpm test:e2e:mock`; 42 Chromium mock tests. |
| `pnpm test:e2e:mock` | Passed | Full frontend-only mock Playwright suite; 42 Chromium tests. |
| `pnpm test:e2e:mock:dashboard` | Passed | Dashboard-focused mock suite; 9 Chromium tests including the `/ui-library` showcase. |
| `pnpm test:e2e:mock:seniors-card` | Passed | Seniors Card-focused mock suite; 18 Chromium tests. |
| `pnpm test:e2e:mock:rental-security-subsidy` | Passed | Rental Security Subsidy-focused mock suite; 18 Chromium tests. |
| `pnpm test:e2e:mock:headed` | Passed | Full visible-browser mock suite; 42 Chromium tests. |
| `pnpm test:e2e:mock:rss-dashboard:headed` | Passed | Focused visible RSS submission to Dashboard flow; 1 Chromium test. |
| `pnpm test:e2e:scenarios` | Passed | Heavier SC/RSS scenario matrix; 9 Chromium tests covering workflow field combinations, evidence validation, summary and dashboard behaviours. |
| `pnpm test:e2e:real` | Passed | Docker-backed real backend suite; 3 Chromium tests. The first run may build local images. |
| `pnpm test:e2e:real:headed` | Passed | Visible-browser Docker-backed real backend suite; 3 Chromium tests. |
| `pnpm test:e2e:real:rss-dashboard:headed` | Passed | Focused visible real backend RSS submission flow; 1 Chromium test. |
| `pnpm test:full-stack-smoke` | Passed | Verifies readiness, frontend status, GraphQL profile/catalogue reads and backend-rendered pages. |
| `pnpm test:reviewer-evidence` | Passed | Verifies public handover docs, screenshots, Markdown links, live frontend links/status URLs and leakage safeguards. |
| `pnpm test:visual` | Runs, currently fails | All 14 full app-page screenshot comparisons fail against stale approved baselines; review and refresh before treating this as a green gate. |
| `pnpm test:visual:showcase` | Passed | Dashboard `/ui-library` desktop and mobile UI Library state baselines. |

Helper scripts:

- `pnpm test:e2e:report` opens the Playwright HTML report and is not a pass/fail test command.
- `pnpm test:visual:update` and `pnpm test:visual:showcase:update` intentionally rewrite approved screenshots; run them only after reviewing and accepting visual changes.

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
