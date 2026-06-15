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
- `QhdsIcon`
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

## Button Contract

`QhdsButton` supports QHDS-style anchor buttons, native buttons and route-style anchors without importing an app router. It preserves native `href`, `target`, `rel` and button `type` semantics, defaults native buttons to `type="button"`, supports `leadingIcon` and `trailingIcon` class hooks, and treats disabled anchor-style buttons with `aria-disabled`, no `href`, no tab stop and suppressed click navigation. Primary buttons emit the reference `.qld__btn` class without a primary modifier; secondary and tertiary buttons add the matching QHDS modifier classes. Static server-rendered buttons and links must not receive synthetic event handlers; handlers are attached only when an interactive caller supplies `onClick` or `onNavigate`.

## Header Contract

`QhdsHeader` renders the single app banner landmark and keeps skip-link ownership in `QhdsLayout`. It uses QHDS/RBDM header hooks for the pre-header, base URL link, CTA wrapper, CTA links, CTA icon/text spans, main header and brand link, while defaulting to web-application width: full-width chrome with 32px desktop side padding, following RBDM and Services Australia rather than website-contained QHDS pages. A `width="contained"` mode remains available for future website-style uses. The pre-header base URL and CTA links are real anchors. The current prototype defaults to mocked account controls, showing `Avery Taylor` and `Logout` in the RBDM CTA pattern with QLD sprite icons for `profile` and `log-out`; pre-header CTA icons use the QHDS dark action secondary token (`#84d3ff` in the current QLD Health palette). The general `QLD-icons.svg` sprite and the QHDS `QLD-Health-icons.svg` extended sprite are both available through `@ssq/ui-assets` URL helpers. QHDS rewrites `extended_` icon ids at runtime, for example `extended_health_alert` becomes `QLD-Health-icons.svg#health_alert`. Callers can replace the account name and logout href or disable these controls when real auth owns the shell. Optional `onNavigate` handlers are attached only when supplied so static server-rendered app headers stay router-free.

## Icon Contract

`QhdsIcon` renders server-compatible QHDS sprite icons with the base `.qld__icon` class. It defaults to the general `QLD-icons.svg` sprite, supports explicit `sprite="qld-health"` and `sprite="utility"` modes, and maps QHDS `extended_` ids to the health sprite by stripping the prefix. It also emits QHDS size hooks such as `.qld__icon--sm` when callers pass `size`. Icons are decorative by default with `aria-hidden`; callers can provide `label` to render an accessible `role="img"` icon. The QHDS core, health and utility sprite URL helpers and required icon-name manifests live in `@ssq/ui-assets`; Next apps load these symbol sprites as static resources rather than image imports.

## Select Contract

`QhdsSelect` and its `QhdsSelectInput` alias render a native server-compatible `<select>` inside the QHDS-style `.qld__select` wrapper. The adapter supports options from data or children, placeholder empty options, disabled and multiple states, QHDS width class hooks, and `QhdsFormField` label, optional, required, hint and error wiring. It composes existing `aria-describedby` values with generated hint/error ids and applies invalid classes without importing upstream QHDS runtime JavaScript.

## Checkbox Contract

`QhdsCheckbox` renders a native checkbox with the QHDS control-input hooks while keeping the `input + label` adjacency required for the QHDS visual treatment. It supports required, optional, hint, error, disabled, controlled `checked` and uncontrolled `defaultChecked` states, composing hint/error ids into `aria-describedby`. `QhdsCheckboxGroup` provides the multi-option fieldset contract with `.qld__checkboxes`, legend, group hint/error text, option hints, disabled options, controlled `value` arrays and uncontrolled `defaultValue` or option-level checked defaults. Controlled read-only displays are marked `readOnly` when no change handler is supplied so React does not warn in client-rendered tests.

## Radio Group Contract

`QhdsRadioGroup` renders native radio inputs inside a QHDS-style fieldset with `.qld__radio-buttons`, `.qld__control-group`, `.qld__control-input`, `.qld__control-input__input` and `.qld__control-input__text` hooks. The adapter keeps one stable group `name`, labels the fieldset through `aria-labelledby`, composes external, hint and error ids into `aria-describedby`, and includes option hint ids on the relevant input. It supports controlled `value`, uncontrolled `defaultValue`, disabled groups and disabled options. Required state is expressed on the fieldset with `aria-required` and on the first enabled native radio only, so the group keeps native validation without repeating the requirement across every option. Controlled read-only displays are marked `readOnly` when no change handler is supplied.
