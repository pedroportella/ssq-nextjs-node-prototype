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

## Layout architecture

The shared app chrome is owned by `@ssq/ui-library` so individual Next.js apps do not recreate landmarks or page structure.

- `QhdsLayout` owns the skip link, optional header/footer slots, optional section navigation aside and stable `main` landmark.
- `QhdsHeader` and `QhdsFooter` expose QGDS/QHDS-compatible banner and contentinfo hooks while staying framework-agnostic.
- `QhdsSideNav` renders accessible section navigation with `aria-current="page"`, nested active branches and optional router interception through `onNavigate`.
- `QhdsWorkflowLayout` owns form/workflow page structure: optional progress aside, back-link area, page header, content region and action row.
- Apps should pass page content sections into `QhdsLayout`; they should not wrap those sections in another `<main>`.

The current layout layer is server-renderable by default. A future mobile drawer enhancement should be isolated behind a client component and must include Escape close, focus trapping, focus restoration and body scroll-lock cleanup tests before adoption.

## Runtime architecture

Next.js app routes that read frontend service data are rendered dynamically so production builds do not bake mock data into browser or server output. Runtime mode is resolved by the server-only service layer:

- mock mode for frontend-only work and the current prototype Compose runtime;
- backend mode only when `BACKEND_INTERNAL_URL` is configured and the relevant service adapter is implemented.

Backend and GraphQL URLs must stay server-only. Apps should import server data helpers from `@ssq/services/server`; browser components should receive data through props and must not use `NEXT_PUBLIC_BACKEND_URL`.

Deployment details live in `docs/frontend-deployment-readiness.md`. Adapter rules live in `docs/design-system-adapter.md`.
