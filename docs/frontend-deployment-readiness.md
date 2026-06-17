# Frontend Deployment Readiness

Short checklist for deploying the three Next.js review apps.

## Apps

- Dashboard: `@ssq/dashboard`
- Seniors Card: `@ssq/seniors-card`
- Rental Security Subsidy: `@ssq/rental-security-subsidy`

Each app has a standalone production build and a public `/status` route.

## Required Boundary

- Backend URLs stay server-side.
- Browser code must not call private backend endpoints directly.
- Public runtime values must contain only safe browser configuration.
- Mock mode must remain obvious during local frontend-only review.

## Checks

```bash
pnpm build
pnpm guard:frontend-source
pnpm guard:browser-bundles
pnpm test:e2e:mock
pnpm test:e2e:real
```

## Public Review URLs

- Dashboard: https://ssq-dashboard-swgsm.ondigitalocean.app
- Seniors Card: https://ssq-seniors-card-lfzpt.ondigitalocean.app
- Rental Security Subsidy: https://ssq-rental-security-subsidy-kgbzf.ondigitalocean.app

DigitalOcean templates support review deployment only. Production promotion belongs in the AWS/platform path mapped in [aws-platform-mapping.md](aws-platform-mapping.md).
