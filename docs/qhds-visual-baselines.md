# QHDS Visual Baselines

The frontend apps include Playwright screenshot baselines for the current QHDS-aligned page composition. These checks are intentionally separate from the default quality gate so they can be run when reviewing visual changes.

## Commands

Compare the current UI with the approved baselines:

```bash
pnpm test:visual
```

Refresh the approved baselines after an intentional QHDS-facing visual change:

```bash
pnpm test:visual:update
```

Both commands run the dashboard, Seniors Card and Rental Security Subsidy apps locally in mock mode. Docker, PostgreSQL and the backend API are not required.

## Current Audit Status

On 2026-06-17, `pnpm test:visual` ran successfully but failed all 14 screenshot comparisons because the current rendered full-page screenshots no longer match the approved PNG baselines. Treat the visual suite as a pending baseline review/refresh before using it as a green quality gate.

`pnpm test:visual:update` was not run during that audit because it intentionally overwrites approved screenshots. Run it only after inspecting the current diffs and accepting the visual changes.

## Captured Pages

Baselines are stored in `tests/visual/__screenshots__/` and cover desktop `1440x900` plus mobile `390x844` viewports.

| App | Route | Reference intent |
| --- | --- | --- |
| Dashboard | `/` | QHDS application content page with page header, status alert, summary list, service cards and data tables. |
| Seniors Card | `/` | QHDS transaction overview page with page header, applicant summary, status alert and action cards. |
| Seniors Card | `/apply` | QHDS workflow form page with progress indicator, direction link, alert, validation summary and form controls. |
| Seniors Card | `/application-status` | QHDS service request status page with request summary, alert, upload control and activity table. |
| Rental Security Subsidy | `/` | QHDS transaction overview page with page header, applicant summary, status alert and action cards. |
| Rental Security Subsidy | `/apply` | QHDS workflow form page with progress indicator, direction link, alert, validation summary and richer form controls. |
| Rental Security Subsidy | `/application-status` | QHDS service request status page with request summary, alert, upload control and activity table. |

## Review Notes

- Inspect changed screenshots before committing refreshed baselines.
- Keep the deterministic mock-smoke assertions active; screenshots complement, not replace, accessibility, contrast, layout and no-backend-request checks.
- The current baselines capture light mode only. Dark-mode, contrast and no-overflow coverage remain in `tests/mock-smoke/frontend-accessibility-qa.spec.ts`.
- The visual run hides Next.js development tooling and disables CSS animation/transition timing before capturing screenshots.
