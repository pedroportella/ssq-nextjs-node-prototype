# Backend Production Readiness

Short gap note for the backend prototype.

## Implemented For Review

- GraphQL and REST contracts over PostgreSQL.
- SQL migrations and deterministic seed data.
- Backend-owned validation and service request lifecycle.
- Demo role boundary for citizen/reviewer paths.
- Health/readiness, correlation IDs, safe errors, CORS, rate limiting and security headers.
- Metadata-only document upload policy.
- Persisted outbox events for future queue integration.

## Production-Next

- Real identity, sessions, SSO/IAM and auditable authorisation.
- Database backups, restore drills, high availability and credential rotation.
- Private object storage, malware scanning, retention and privacy review.
- Queue worker, retry, replay, reconciliation and dead-letter handling.
- Central logging, metrics, tracing, alerting and runbooks.
- Threat modelling, penetration testing and formal security/privacy assurance.

## Local Hardening Checks

```bash
pnpm --dir backend test
pnpm test:full-stack-smoke
pnpm guard:artifacts
pnpm guard:browser-bundles
```
