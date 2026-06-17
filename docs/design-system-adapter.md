# Design-System Adapter

The prototype uses local React wrappers to express QHDS-style application UI without importing upstream browser runtime code.

## Package Roles

- [ui-tokens](../frontend/packages/ui-tokens): colour, spacing and typography primitives.
- [ui-assets](../frontend/packages/ui-assets): icons and reusable visual assets.
- [ui-library](../frontend/packages/ui-library): React components, theme entrypoint and app-facing API.

## Adapter Rules

- Preserve useful QHDS/QGDS class hooks, visual states and semantics.
- Implement behaviour locally in TypeScript/React or Lit.
- Keep application routes thin; pages compose containers and shared components.
- Keep tokens and shared styles in packages rather than route-level one-offs.
- Use Playwright and visual baselines to protect layout, focus, contrast and responsive behaviour.

## Current Component Coverage

- Layout, header, footer, side navigation and workflow layout.
- Buttons, links, cards, alerts, tabs, accordions and progress/status surfaces.
- Text input, select, checkbox, radio, textarea and validation summary.
- Tables, summary lists and file upload controls.
- Dashboard UI Library showcase for component-state review.

## Verify

```bash
pnpm test:e2e:mock:dashboard
pnpm test:e2e:mock
pnpm test:visual:showcase
```
