# QHDS Visual Baselines

Playwright screenshots protect the QHDS-style app layout and UI Library component states.

## Commands

```bash
pnpm test:visual
pnpm test:visual:showcase
```

Refresh approved baselines only after reviewing the changed images:

```bash
pnpm test:visual:update
pnpm test:visual:showcase:update
```

## Coverage

Baselines live in [tests/visual/__screenshots__](../tests/visual/__screenshots__) and cover desktop `1440x900` plus mobile `390x844` views for:

- Dashboard home.
- Dashboard UI Library showcase.
- Seniors Card overview, apply and status.
- Rental Security Subsidy overview, apply and status.

## Current Status

The app-page and UI Library showcase baselines were refreshed and checked on 2026-06-17.

## Notes

- Inspect screenshot diffs before committing refreshed baselines.
- Screenshot tests complement, not replace, accessibility, contrast, layout and no-backend-request assertions.
- Current baselines cover light mode; broader colour/contrast coverage lives in Playwright assertions.
