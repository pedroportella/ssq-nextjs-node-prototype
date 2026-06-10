# Backend Production Readiness

This note separates implemented prototype controls from production-next work.

## Implemented For Review

- Backend-owned validation for submitted draft payloads.
- Customer-owned draft, request, upload and summary access for demo citizens.
- Demo review roles for submitted-record review and status transitions.
- Metadata-only supporting document upload policy with type, size, category and ownership checks.
- Submission summary metadata and text download.
- Activity logs and persisted outbox events.
- Correlation IDs, safe generic REST errors and redacted runtime logs.
- CORS allow-list configuration, simple in-memory rate limiting and security response headers.
- SQL migrations, seed data and local Docker runtime.

## Production-Next Gaps

- Replace demo headers with real identity, session management, SSO/IAM integration and auditable authorization policy.
- Add production-grade rate limiting backed by shared infrastructure rather than per-process memory.
- Add full CORS environment management for deployed frontend origins.
- Add malware scanning, private object storage, retention policy enforcement and privacy review for documents.
- Add real queue publishing, retry policy, dead-letter handling and outbox processing.
- Add audit trails for operational reads and status updates.
- Add structured log shipping, metrics, tracing exporters and alerting.
- Add pagination/filtering contracts for activity logs and drafts if required by reviewer/dashboard workflows.
- Run threat modelling, privacy impact review, accessibility review and penetration testing before any production claim.

## Local Hardening Configuration

- `CORS_ALLOWED_ORIGINS`: comma-separated allowed browser origins. Empty means no browser origins are allowed.
- `RATE_LIMIT_ENABLED`: defaults to `true`.
- `RATE_LIMIT_MAX`: requests per window, default `120`.
- `RATE_LIMIT_WINDOW_MS`: rate window in milliseconds, default `60000`.
- `DEBUG_ROUTES_ENABLED`: defaults to `false`; ignored in production.

These controls make the prototype safer and easier to review, but they are not a substitute for production platform security controls.
