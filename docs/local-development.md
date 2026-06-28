# Local Development

Use Docker for full-stack review. Use frontend-only mock mode for quick UI work.

## Full Stack

```bash
pnpm install
pnpm docker:build
pnpm docker:up:backend
pnpm test:full-stack-smoke
pnpm test:e2e:real
pnpm docker:down
```

Default URLs:

- Backend API: `http://localhost:7001`
- Dashboard: `http://localhost:3300`
- Seniors Card: `http://localhost:3001`
- Rental Security Subsidy: `http://localhost:3002`

## Alternate Ports

```bash
BACKEND_PORT=7101 \
DASHBOARD_PORT=3310 \
SENIORS_CARD_PORT=3311 \
RENTAL_SECURITY_SUBSIDY_PORT=3312 \
SSQ_FRONTEND_DATA_SOURCE=backend \
docker compose up -d postgres backend dashboard seniors-card rental-security-subsidy
```

## Frontend-Only Mode

Run one app:

```bash
pnpm --filter @ssq/dashboard dev
pnpm --filter @ssq/seniors-card dev
pnpm --filter @ssq/rental-security-subsidy dev
```

Or run mock E2E coverage:

```bash
pnpm test:e2e:mock
pnpm test:e2e:mock:dashboard
pnpm test:e2e:mock:seniors-card
pnpm test:e2e:mock:rental-security-subsidy
```

## Real Backend E2E

Start the Docker-backed runtime first, then run:

```bash
pnpm test:e2e:real
pnpm test:e2e:real:headed
```

## Visual Baselines

```bash
pnpm test:visual
pnpm test:visual:showcase
```

Refresh only after reviewing the rendered differences:

```bash
pnpm test:visual:update
pnpm test:visual:showcase:update
```

## Test Command Audit

- `test:e2e:mock*` means frontend-only mock runtime.
- `test:e2e:real*` means Docker-backed backend runtime.
- `test:full-stack-smoke` checks backend readiness, GraphQL reads and backend-rendered frontend pages.
- Visual tests are separate because screenshot baselines need human review before refresh.

## Clean Up

```bash
pnpm docker:down
```
