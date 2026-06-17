# Accessibility And UI Library Evidence

This note summarises the SSQ prototype evidence for UI-library, QHDS alignment, responsive and accessibility criteria.

It is evidence for a review prototype, not a formal WCAG audit or Queensland Government production accessibility sign-off.

## Implemented UI Library Surfaces

The prototype uses `@ssq/ui-library` as a React adapter for QHDS-style application UI. The UI library keeps application pages on stable React APIs while preserving QHDS-compatible class hooks, tokens and semantic structure.

| Surface | Evidence |
| --- | --- |
| Page shell and landmarks | [QhdsLayout](../frontend/packages/ui-library/src/components/QhdsLayout), [QhdsHeader](../frontend/packages/ui-library/src/components/QhdsHeader), [QhdsFooter](../frontend/packages/ui-library/src/components/QhdsFooter), [frontend architecture](frontend-architecture.md). |
| UI Library showcase | Dashboard route `/ui-library`, [UILibraryShowcaseContainer](../frontend/apps/dashboard/src/containers/UILibraryShowcaseContainer.tsx), and focused visual baselines for component states that are hard to reach through app journeys. |
| Left navigation | [QhdsSideNav](../frontend/packages/ui-library/src/components/QhdsSideNav) implements QHDS `qld__left-nav` hooks, current-page state and server-renderable branch state. |
| Workflow pages | [QhdsWorkflowLayout](../frontend/packages/ui-library/src/components/QhdsWorkflowLayout), [Seniors Card apply](../frontend/apps/seniors-card/src/containers/SeniorsCardApplyContainer.tsx), [Rental Security Subsidy apply](../frontend/apps/rental-security-subsidy/src/containers/RentalSecuritySubsidyApplyContainer.tsx). |
| Forms and validation | [QhdsTextInput](../frontend/packages/ui-library/src/components/forms/QhdsTextInput), [QhdsSelect](../frontend/packages/ui-library/src/components/forms/QhdsSelect), [QhdsRadioGroup](../frontend/packages/ui-library/src/components/forms/QhdsRadioGroup), [QhdsCheckbox](../frontend/packages/ui-library/src/components/forms/QhdsCheckbox), [QhdsTextarea](../frontend/packages/ui-library/src/components/forms/QhdsTextarea), and validation assertions in [frontend-accessibility-qa.spec.ts](../tests/mock-smoke/frontend-accessibility-qa.spec.ts). |
| Summary, status and data display | [QhdsSummaryList](../frontend/packages/ui-library/src/components/QhdsSummaryList), [QhdsTable](../frontend/packages/ui-library/src/components/QhdsTable), [QhdsPageAlert](../frontend/packages/ui-library/src/components/QhdsPageAlert), [QhdsProgressIndicator](../frontend/packages/ui-library/src/components/QhdsProgressIndicator). |
| Interactive components | [QhdsButton](../frontend/packages/ui-library/src/components/QhdsButton), [QhdsTabs](../frontend/packages/ui-library/src/components/QhdsTabs), [QhdsAccordion](../frontend/packages/ui-library/src/components/QhdsAccordion), with component tests colocated beside the adapters. |
| Upload and document controls | [QhdsFileUpload](../frontend/packages/ui-library/src/components/QhdsFileUpload), Seniors Card and Rental Security Subsidy status pages, and upload accessible-name checks in the Playwright smoke suite. |
| Icons, tokens, spacing and typography | [ui-assets](../frontend/packages/ui-assets), [ui-tokens](../frontend/packages/ui-tokens), [theme.css](../frontend/packages/ui-library/src/theme/theme.css), and [design-system adapter notes](design-system-adapter.md). |

## Accessibility Evidence

| Accessibility concern | Implemented evidence | Check |
| --- | --- | --- |
| Landmarks and headings | Each covered page is expected to render a visible `main` landmark and one visible `h1`. | [frontend-accessibility-qa.spec.ts](../tests/mock-smoke/frontend-accessibility-qa.spec.ts). |
| Component state coverage | The Dashboard `/ui-library` showcase renders alert, action, form, upload, navigation, data-display and workflow states, including disabled, invalid, empty, loading, uploaded and rejected examples. | [frontend-accessibility-qa.spec.ts](../tests/mock-smoke/frontend-accessibility-qa.spec.ts), [ui-library-showcase-baselines.spec.ts](../tests/visual/ui-library-showcase-baselines.spec.ts). |
| Keyboard focus | The smoke suite tabs into each page and verifies the focused element has a visible outline or focus treatment. It also focuses invalid controls directly. | `pnpm test:e2e:mock:dashboard` for dashboard, `pnpm test:e2e:mock` for all apps. |
| Form labels and validation association | Invalid fields expose `aria-invalid="true"` and connect hint/error text through `aria-describedby`; form controls are native inputs, selects, radios, checkboxes and textareas. | Seniors Card date-of-birth and Rental Security Subsidy weekly-rent assertions in [frontend-accessibility-qa.spec.ts](../tests/mock-smoke/frontend-accessibility-qa.spec.ts). |
| Upload and download accessible names | Status pages expose upload controls with the shared accessible file-input label and summary download links with expected accessible names. | Status-page assertions in [frontend-accessibility-qa.spec.ts](../tests/mock-smoke/frontend-accessibility-qa.spec.ts). |
| Responsive layout and no horizontal overflow | Desktop `1440x900` and mobile `390x844` sweeps check each app route for visible content and no incoherent horizontal overflow. | [frontend-accessibility-qa.spec.ts](../tests/mock-smoke/frontend-accessibility-qa.spec.ts). |
| Colour contrast | Browser-computed contrast assertions cover body text, headings, links, visited links, action colours, focus indicators, errors and feedback surfaces across light, alt, dark and dark-alt QHDS surfaces. | [frontend-accessibility-qa.spec.ts](../tests/mock-smoke/frontend-accessibility-qa.spec.ts). |
| Browser-only backend leakage | Mock smoke and visual checks block browser requests to local backend origins and `/graphql`, reinforcing the server-only service boundary. | [frontend-accessibility-qa.spec.ts](../tests/mock-smoke/frontend-accessibility-qa.spec.ts), [qhds-visual-baselines.spec.ts](../tests/visual/qhds-visual-baselines.spec.ts). |
| Visual regression | Desktop and mobile screenshot baselines cover dashboard, overview, apply and status pages for both transaction apps, but the current full-page screenshots need a baseline review/refresh. The UI Library showcase has a focused passing visual command. | `pnpm test:visual`, `pnpm test:visual:showcase`; baselines in [tests/visual/\_\_screenshots\_\_](../tests/visual/__screenshots__). See [QHDS visual baselines](qhds-visual-baselines.md#current-audit-status). |

## Responsive And Visual Evidence

README screenshots:

- [Dashboard](screenshots/ssq-dashboard.png)
- [Seniors Card overview](screenshots/ssq-seniors-card.png)
- [Seniors Card apply flow](screenshots/ssq-seniors-card-apply.png)
- [Rental Security Subsidy overview](screenshots/ssq-rental-security-subsidy.png)

Visual baseline screenshots:

- [Dashboard desktop](../tests/visual/__screenshots__/dashboard-home-desktop.png)
- [Dashboard mobile](../tests/visual/__screenshots__/dashboard-home-mobile.png)
- [UI Library showcase desktop](../tests/visual/__screenshots__/ui-library-showcase-desktop.png)
- [UI Library showcase mobile](../tests/visual/__screenshots__/ui-library-showcase-mobile.png)
- [Seniors Card apply desktop](../tests/visual/__screenshots__/seniors-card-apply-desktop.png)
- [Seniors Card apply mobile](../tests/visual/__screenshots__/seniors-card-apply-mobile.png)
- [Rental Security Subsidy apply desktop](../tests/visual/__screenshots__/rental-security-subsidy-apply-desktop.png)
- [Rental Security Subsidy apply mobile](../tests/visual/__screenshots__/rental-security-subsidy-apply-mobile.png)

The full baseline set is documented in [QHDS visual baselines](qhds-visual-baselines.md).

## Commands

Focused dashboard accessibility and layout smoke:

```bash
pnpm test:e2e:mock:dashboard
```

Full frontend accessibility and layout smoke across dashboard, Seniors Card and Rental Security Subsidy:

```bash
pnpm test:e2e:mock
```

Visual regression baselines:

```bash
pnpm test:visual
```

The 2026-06-17 command audit found the visual suite runs but currently fails all 14 screenshot comparisons against stale approved baselines. Review the diffs and refresh intentionally before using visual regression as a green release gate.

Focused UI Library showcase baselines:

```bash
pnpm test:visual:showcase
pnpm test:visual:showcase:update
```

Use the focused showcase command when changing `@ssq/ui-library` component states without refreshing the broader stale app-page baseline set.

Component and package checks:

```bash
pnpm --filter @ssq/ui-library check
pnpm --filter @ssq/ui-tokens check
pnpm --filter @ssq/ui-assets check
```

## Known Limits And Production Review Steps

- The smoke suite is targeted accessibility evidence, not a complete WCAG audit.
- No automated axe dependency is included. The current suite uses deterministic Playwright assertions to keep the prototype lean and avoid introducing a broad rule engine before a production accessibility strategy is agreed.
- Manual screen-reader review remains required before any production claim.
- Real production release would need accessibility review with representative users, browser/device coverage, assistive technology checks and agency approval.
- Visual baselines currently capture light mode. Dark-mode and contrast coverage are checked through computed Playwright assertions rather than stored screenshots.
- Supporting document upload is metadata-only in this prototype; production document handling would require privacy, security, retention and malware-scanning review.

## Product And Service-Design Notes

The UI deliberately keeps workflow forms plain and task-focused: page shell and navigation are separate from form content, form sections use semantic fieldsets and legends, and validation is owned by accessible form controls rather than decorative panels. That gives product managers, customer experience specialists, service designers and engineers a concrete review surface for iterating the customer journey.
