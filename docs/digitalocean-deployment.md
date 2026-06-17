# DigitalOcean Review Deployment

DigitalOcean App Platform hosts the public review apps. It is not Queensland Government production infrastructure.

## Shape

- One shared backend service.
- Three public frontend apps: dashboard, Seniors Card and Rental Security Subsidy.
- Managed PostgreSQL for review data.
- Generated deployment specs stay out of Git; safe templates live under [.do](../.do).

## Public Apps

- Dashboard: https://ssq-dashboard-swgsm.ondigitalocean.app
- Seniors Card: https://ssq-seniors-card-lfzpt.ondigitalocean.app
- Rental Security Subsidy: https://ssq-rental-security-subsidy-kgbzf.ondigitalocean.app

## Deploy Order

1. Run local quality checks.
2. Build images or app artefacts.
3. Update backend/review database config in the platform.
4. Deploy backend first.
5. Deploy frontend apps with server-side backend config.
6. Run status checks and smoke tests.

## Verify

```bash
curl -i https://ssq-dashboard-swgsm.ondigitalocean.app/status
curl -i https://ssq-seniors-card-lfzpt.ondigitalocean.app/status
curl -i https://ssq-rental-security-subsidy-kgbzf.ondigitalocean.app/status
pnpm test:reviewer-evidence
```

Use [aws-platform-mapping.md](aws-platform-mapping.md) for the production platform direction.
