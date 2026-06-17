# Release Runbook

Short handover for reviewing the SSQ prototype live or locally.

Last verified: 2026-06-17.

## Live Review

Open:

- Dashboard: https://ssq-dashboard-swgsm.ondigitalocean.app
- Seniors Card: https://ssq-seniors-card-lfzpt.ondigitalocean.app
- Rental Security Subsidy: https://ssq-rental-security-subsidy-kgbzf.ondigitalocean.app

Status checks:

```bash
curl -i https://ssq-dashboard-swgsm.ondigitalocean.app/status
curl -i https://ssq-seniors-card-lfzpt.ondigitalocean.app/status
curl -i https://ssq-rental-security-subsidy-kgbzf.ondigitalocean.app/status
```

Expected result: each app returns HTTP `200` with `status: UP`.

DigitalOcean is review infrastructure only. Backend URLs, app IDs, generated specs and operations endpoints are intentionally kept out of public docs.

## Local Review

```bash
pnpm install
pnpm docker:build
pnpm docker:up:backend
pnpm test:full-stack-smoke
pnpm docker:down
```

Default local URLs:

- Backend API: `http://localhost:7001`
- Dashboard: `http://localhost:3000`
- Seniors Card: `http://localhost:3001`
- Rental Security Subsidy: `http://localhost:3002`

Use [local-development.md](local-development.md) for alternate ports and frontend-only mode.

## Quality Gate

```bash
pnpm test:reviewer-evidence
pnpm guard:artifacts
pnpm guard:terminology
pnpm build
pnpm guard:browser-bundles
pnpm guard:frontend-source
pnpm check
```

`pnpm test:reviewer-evidence` checks required public docs, screenshots, live links, status links, local Markdown links and obvious public-doc leakage patterns.

## Share Checklist

- Live app links open.
- `/status` returns `UP` for all three apps.
- Screenshot links render from the README.
- Reviewer evidence smoke passes.
- Public docs keep prototype limits clear.
- No generated specs, secrets, reports, local databases or private backend hosts are tracked.

## Maintainer Smoke Against Deployed Backend

Maintainers with the private backend review URL can run:

```bash
SSQ_SMOKE_BACKEND_READY_URL=https://<private-backend-host>/health/ready \
SSQ_SMOKE_GRAPHQL_URL=https://<private-backend-host>/graphql \
SSQ_SMOKE_DASHBOARD_URL=https://ssq-dashboard-swgsm.ondigitalocean.app \
SSQ_SMOKE_SENIORS_CARD_URL=https://ssq-seniors-card-lfzpt.ondigitalocean.app \
SSQ_SMOKE_RENTAL_SECURITY_SUBSIDY_URL=https://ssq-rental-security-subsidy-kgbzf.ondigitalocean.app \
pnpm test:full-stack-smoke
```
