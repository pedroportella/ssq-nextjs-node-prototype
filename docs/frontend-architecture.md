# Frontend architecture

The frontend prototype contains three separately deployable Next.js apps and shared frontend packages under `frontend/packages`.

## Current UI direction

This repository implements QHDS-style UI as React wrappers only.

- `@ssq/ui-library` owns React components, tests and component-owned SCSS.
- `@ssq/ui-tokens` owns token and palette values.
- `@ssq/ui-assets` owns shared asset references.
- Apps import the shared theme through `@ssq/ui-library/theme.css`.

The prototype no longer contains a local web-components package. The earlier Lit/custom-element exploration has been preserved in the copied `ssq-web-components` repository so this repo can stay focused on Next.js app workflows and React component ergonomics.

Do not add `frontend/packages/web-components`, `@ssq/web-components`, `SsqWeb*` React bridge wrappers, generated `custom-elements.json`, `lit-analyzer`, or web-component browser harnesses here unless the prototype direction changes again.

## Component structure

Reusable UI should stay component-owned:

- `Component.tsx`
- `Component.test.tsx`
- `Component.scss`
- `index.ts`

Theme entrypoints should own tokens, palettes, resets and integration-level imports. Avoid growing `theme.css` into a catch-all file for bespoke component styles.
