# Accessibility And UI Library Evidence

Evidence for QHDS-style UI library work, responsive behaviour and accessibility checks. This is not a formal WCAG audit.

## Implemented UI Surfaces

- Page shell, header, footer, side navigation and workflow layout in [ui-library components](../frontend/packages/ui-library/src/components).
- Form controls for text input, select, radio, checkbox, textarea, validation summary and grouped field behaviour.
- Data and status surfaces: summary list, tables, alerts, tabs, accordion, progress indicator and file upload.
- Dashboard `/ui-library` route for component states that are hard to reach through app journeys.
- Shared tokens, theme entrypoint and assets in [frontend/packages](../frontend/packages).

## Accessibility Evidence

| Concern | Check |
| --- | --- |
| Landmarks/headings | Playwright checks visible main content and page headings. |
| Labels/errors | Form controls use native inputs, labels, hints, `aria-invalid` and described error text. |
| Keyboard focus | Smoke tests tab through pages and assert visible focus treatment. |
| Upload/download names | Upload inputs and summary download links have accessible names. |
| Responsive layout | Desktop and mobile sweeps check visible content and no incoherent horizontal overflow. |
| Colour contrast | Browser-computed checks cover body text, links, headings, actions, errors and feedback surfaces. |
| Browser backend leakage | Mock/visual runs block browser requests to local backend origins and `/graphql`. |
| Visual regression | Desktop and mobile baselines cover app pages and the UI Library showcase. |

## Commands

```bash
pnpm test:e2e:mock:dashboard
pnpm test:e2e:mock
pnpm test:visual
pnpm test:visual:showcase
```

Refresh baselines only after reviewing the changed screenshots:

```bash
pnpm test:visual:update
pnpm test:visual:showcase:update
```

## Known Limits

- This is automated evidence, not a manual accessibility audit.
- The current visual baseline set covers light mode; broader contrast and dark-surface checks live in Playwright assertions.
- Production would still require manual assistive-technology review, content review and formal accessibility sign-off.
