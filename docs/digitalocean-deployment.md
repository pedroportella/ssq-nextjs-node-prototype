# DigitalOcean Review Deployment

This repository includes safe DigitalOcean App Platform templates for the SSQ prototype review runtime.

The templates are committed under `.do/`:

- `.do/ssq-node-api.template.yml`
- `.do/ssq-dashboard.template.yml`
- `.do/ssq-seniors-card.template.yml`
- `.do/ssq-rental-security-subsidy.template.yml`

They are templates, not live deployment specs. Keep app IDs, generated default domains, personal access tokens, encrypted secret blobs and private notes out of Git.

## Deployment Shape

The review deployment uses four separate App Platform apps:

- `ssq-node-api`: shared backend API built from `backend/Dockerfile`.
- `ssq-dashboard`: dashboard app built from `frontend/apps/dashboard/Dockerfile`.
- `ssq-seniors-card`: Seniors Card app built from `frontend/apps/seniors-card/Dockerfile`.
- `ssq-rental-security-subsidy`: Rental Security Subsidy app built from `frontend/apps/rental-security-subsidy/Dockerfile`.

This mirrors the prototype boundary: three separately deployable public apps, one shared backend, and backend access kept behind the server-only frontend service layer.

## Template Values To Replace

Copy each template to a local spec before editing:

```bash
cp .do/ssq-node-api.template.yml .do/ssq-node-api.local.yml
cp .do/ssq-dashboard.template.yml .do/ssq-dashboard.local.yml
cp .do/ssq-seniors-card.template.yml .do/ssq-seniors-card.local.yml
cp .do/ssq-rental-security-subsidy.template.yml .do/ssq-rental-security-subsidy.local.yml
```

`.do/*.local.yml` and `.do/*.generated.yml` are intentionally blocked by the artifact guard and must not be committed.

Replace these values in local specs:

- `region`: defaults to `syd`; change only if the review account needs another App Platform region.
- `deploy_on_push`: defaults to `false`; keep this for manual review deployments unless automatic deploys are explicitly wanted.
- `BACKEND_INTERNAL_URL`: set this on all three frontend apps to the backend App Platform URL, for example `https://ssq-node-api-xxxxx.ondigitalocean.app`.
- `DASHBOARD_PUBLIC_URL`, `SENIORS_CARD_PUBLIC_URL`, `RENTAL_SECURITY_SUBSIDY_PUBLIC_URL`: set these to the live public URLs for the three frontend apps.
- `CORS_ALLOWED_ORIGINS`: set this on the backend to the comma-separated live frontend origins. This is mainly for manual API review because browser app code should not call the backend directly.

Do not replace `DATABASE_URL` with a literal PostgreSQL connection string in a committed file. The backend template uses the App Platform bindable variable `${ssq-prototype-db.DATABASE_URL}` so DigitalOcean injects the database connection at runtime.

## Database

The backend template defines an App Platform dev PostgreSQL database:

```yaml
databases:
  - name: ssq-prototype-db
    engine: PG
    version: "16"
```

Use this only for review infrastructure. For a managed database, create or select the managed cluster in DigitalOcean and adjust the local backend spec with the cluster details before deployment.

The backend service runs migrations and seed data before startup:

```text
cd backend && pnpm db:migrate && pnpm db:seed && pnpm start
```

## Deployment Order

1. Create or update the backend app from `.do/ssq-node-api.local.yml`.
2. Capture the backend public URL from DigitalOcean.
3. Set that URL as `BACKEND_INTERNAL_URL` in the three frontend local specs.
4. Create or update the three frontend apps.
5. Capture the three frontend public URLs.
6. Update the three frontend local specs with cross-app public URLs.
7. Update the backend local spec `CORS_ALLOWED_ORIGINS` with the three frontend origins.
8. Redeploy any app whose local spec changed.

With `doctl`, the create/update shape is:

```bash
doctl apps create --spec .do/ssq-node-api.local.yml
doctl apps update <app-id> --spec .do/ssq-node-api.local.yml
```

The same pattern applies to the three frontend specs.

## Verification

After deployment, check the backend and frontend status endpoints:

```bash
curl -i https://ssq-node-api-xxxxx.ondigitalocean.app/health/ready
curl -i https://ssq-dashboard-xxxxx.ondigitalocean.app/status
curl -i https://ssq-seniors-card-xxxxx.ondigitalocean.app/status
curl -i https://ssq-rental-security-subsidy-xxxxx.ondigitalocean.app/status
```

The same full-stack smoke script can validate deployed URLs:

```bash
SSQ_SMOKE_BACKEND_READY_URL=https://ssq-node-api-xxxxx.ondigitalocean.app/health/ready \
SSQ_SMOKE_GRAPHQL_URL=https://ssq-node-api-xxxxx.ondigitalocean.app/graphql \
SSQ_SMOKE_DASHBOARD_URL=https://ssq-dashboard-xxxxx.ondigitalocean.app \
SSQ_SMOKE_SENIORS_CARD_URL=https://ssq-seniors-card-xxxxx.ondigitalocean.app \
SSQ_SMOKE_RENTAL_SECURITY_SUBSIDY_URL=https://ssq-rental-security-subsidy-xxxxx.ondigitalocean.app \
pnpm test:full-stack-smoke
```

Keep live review links in `docs/live-review-links.md` during the live deployment stage, not in these templates.

## References

- DigitalOcean App Spec reference: https://docs.digitalocean.com/products/app-platform/reference/app-spec/
- DigitalOcean App Platform database management: https://docs.digitalocean.com/products/app-platform/how-to/manage-databases/
