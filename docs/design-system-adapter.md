# Design-System Adapter

The prototype uses `@ssq/ui-library` as a React adapter for QHDS-style application UI. The adapter exists so apps can depend on stable React component APIs while design-system implementation details remain replaceable.

## Package Roles

- `@ssq/ui-library` owns React components and component SCSS.
- `@ssq/ui-tokens` owns shared design tokens and palette values.
- `@ssq/ui-assets` owns shared static assets.
- Apps import `@ssq/ui-library/theme.css` once from their app-level CSS.

## Adapter Rules

- Keep app pages composed from `@ssq/ui-library` components where practical.
- Keep component styles beside the component, not in app-specific global CSS.
- Keep backend/data concerns out of UI components.
- Prefer server-renderable components by default.
- Use `"use client"` only for components that own browser interaction, such as tabs or accordions.
- Keep accessibility semantics inside the adapter when they are part of the component contract.

## Current Components

The current workflow-facing adapter surface includes:

- `QhdsLayout`
- `QhdsHeader`
- `QhdsFooter`
- `QhdsSideNav`
- `QhdsWorkflowLayout`
- `QhdsPageHeader`
- `QhdsContentSection`
- `QhdsSummaryList`
- `QhdsCard`
- `QhdsPageAlert`
- `QhdsButton`
- `QhdsAccordion`
- `QhdsTabs`
- `QhdsTable`
- `QhdsProgressIndicator`
- `QhdsFileUpload`
- form controls under `components/forms`

## Future QHDS Integration

If a real QHDS React package or another official adapter becomes available, migrate behind these component contracts first. Avoid changing app pages directly until the adapter API has been mapped.

A replacement should preserve:

- accessible names, roles and keyboard behaviour;
- SSR compatibility for non-interactive components;
- token-driven colours, spacing and typography;
- app-level import stability from `@ssq/ui-library`.

The prototype should not reintroduce local web components or generated custom-element manifests unless the frontend direction changes explicitly.
