# Frontend Architecture

Three Next.js apps share services, UI components, tokens and mock data while remaining separately deployable.

## Apps

- [dashboard](../frontend/apps/dashboard): service catalogue, request visibility and reviewer-style surfaces.
- [seniors-card](../frontend/apps/seniors-card): simpler citizen transaction flow.
- [rental-security-subsidy](../frontend/apps/rental-security-subsidy): richer transaction flow with documents and status history.

## Shared Packages

- [services](../frontend/packages/services): typed DTOs, server-only backend clients, mock data and app service modules.
- [ui-library](../frontend/packages/ui-library): QHDS-style React components and theme entrypoint.
- [ui-tokens](../frontend/packages/ui-tokens): shared CSS variables and design primitives.
- [ui-assets](../frontend/packages/ui-assets): icons and visual assets.
- [utils](../frontend/packages/utils): shared formatting and validation helpers.

## Runtime Boundary

Pages call service modules from server-side code. Browser components receive already-shaped data and never need the private backend origin.

## Verify

```bash
pnpm check
pnpm test:e2e:mock
pnpm test:e2e:real
```
