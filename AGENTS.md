# SSQ Prototype Agent Guide

Durable repo guidance for the SSQ Next.js + Node.js prototype.

## Where Context Belongs

- Keep stable engineering rules here.
- Keep private research, stage diaries and future-work planning in `../ai-notes/`.
- Keep public reviewer docs short and professional: README, `docs/`, screenshots, run commands and evidence links.
- Do not copy private planning history or stage labels into public docs, UI copy or commit subjects.
- Start future work with `../ai-notes/README.md` and `../ai-notes/ssq-current-state.md`.

## Project Boundary

- This is a review prototype for Queensland Government-style digital transaction workflows.
- Do not describe it as an official Queensland Government, Smart Service Queensland, myQLD or production Digital Transaction Platform system.
- Do not imply real citizen data, production identity, agency endorsement, production hosting, production security controls or private government integration.
- Prefer honest language: prototype, production-shaped, review environment, future integration point and production-next.

## Repo Shape

- Repo root: `ssq-nextjs-node-prototype/`.
- `backend/`: Node.js/Fastify API, GraphQL, REST routes, PostgreSQL, validation, lifecycle, uploads, observability and operations endpoints.
- `frontend/apps/dashboard`: reviewer/admin-style dashboard.
- `frontend/apps/seniors-card`: simpler citizen transaction.
- `frontend/apps/rental-security-subsidy`: richer citizen transaction with documents/status.
- `frontend/packages/services`: DTOs, server-only clients, mocks and app service modules.
- `frontend/packages/ui-library`: QHDS-style React components and theme entrypoint.
- `frontend/packages/ui-tokens`, `ui-assets`, `utils`: shared design and helper packages.
- `docker/`, `.github/workflows/` and `.do/`: local runtime, CI and review deployment support.

## Runtime

- Use Node.js 22 and pnpm 10.18.3.
- Prefer TypeScript throughout.
- Do not commit dependencies, build output, coverage, reports, logs, local databases, local environment files or generated DigitalOcean specs.
- Check `git status` before editing and preserve user changes.
- Do not push commits/tags/refs unless Pedro explicitly asks in the current turn.

## Frontend Rules

- Use Next.js App Router, React and TypeScript.
- Routes stay thin; containers and shared packages own workflow composition.
- Backend communication stays server-side through `frontend/packages/services`.
- Browser code must not know private backend origins, privileged headers or operations endpoints.
- Public `NEXT_PUBLIC_*` values may contain only safe browser configuration.
- Mock mode must stay explicit and aligned with backend contracts.
- Use semantic forms, clear labels, fieldsets, legends, error text, visible focus and keyboard-operable controls.
- Each routed page should keep one clear `h1`, useful landmarks, readable contrast and no layout overflow.
- Avoid marketing-page composition; this should feel like a public-service workflow.
- Put reusable UI in `frontend/packages/ui-library`, with colocated tests/styles and package exports.
- Keep token/style layering clear: tokens, theme, app globals, route/container styles, component styles.
- Avoid card nesting and route-level one-off colours, shadows, spacing or focus styles.

## QHDS Adapter Rules

- Use QHDS/QGDS repositories as design-system references, not runtime dependencies.
- Preserve useful classes, semantics and visual states; implement behaviour locally.
- Do not import upstream QHDS browser JavaScript directly.
- Prioritise high-value wrappers: layout, header/footer, button, forms, alerts, tabs, tables, file upload, progress/status, cards, accordions, checkboxes and radios.
- File upload must have real input behaviour, accessible errors, validation hooks and backend policy integration before it is considered complete.

## Backend Rules

- Build a production-shaped backend, not a thin mock API.
- Keep validation, persistence, workflow state, document policy and service request lifecycle backend-authoritative.
- Keep controllers/resolvers focused on transport; put rules in services and SQL access in repositories.
- Use REST where HTTP semantics fit better than GraphQL, especially health, upload and download surfaces.
- Return safe errors with correlation IDs; never expose stack traces, secrets, personal data or infrastructure detail.
- Demo identity and roles are prototype-only and must stay obvious in code and docs.
- Document production-next needs for identity, authorisation, private storage, malware scanning, retention, audit, queueing and observability.

## Tests And Checks

- Add focused tests when behaviour changes.
- Use Vitest for backend/services/packages and Playwright for routed UI, keyboard access, viewport, validation and workflow smoke.
- Preserve the command split:
  - `pnpm test:e2e:mock*` for frontend-only mock runtime;
  - `pnpm test:e2e:real*` for Docker-backed backend runtime;
  - `pnpm test:full-stack-smoke` for backend readiness, GraphQL reads and backend-rendered pages.
- Run relevant guards after public docs, config or boundary changes:
  - `pnpm test:reviewer-evidence`
  - `pnpm guard:artifacts`
  - `pnpm guard:terminology`
  - `pnpm guard:frontend-source`
  - `pnpm guard:browser-bundles`

## Documentation

- README should answer: what this is, live links, screenshots, how to run, what is real, what is simulated and what production-next requires.
- Public docs should be evidence notes, not implementation diaries.
- Put long research and decision history in `../ai-notes/`.
- DigitalOcean is review infrastructure only; AWS/platform docs are production mapping only unless implemented.
- Refresh screenshots/baselines only after reviewing the rendered output.

## Handoff

- Final wrap-ups should mention files changed, verification run, caveats and a suggested commit subject.
- Suggested commits use `type(scope): past-tense summary`.
- Keep commit subjects concise, public-safe and free of private stage labels.
