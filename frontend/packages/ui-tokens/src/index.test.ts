import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { prototypeTokens } from "./index";

const styles = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "styles.css"),
  "utf8"
);

describe("prototypeTokens", () => {
  it("documents the selected QHDS token boundary", () => {
    expect(prototypeTokens.source).toBe("qhds-reference-css-snapshot");
    expect(prototypeTokens.selectedPalette).toBe("qld-health");
    expect(prototypeTokens.color.primitive.heading).toBe("#000053");
    expect(prototypeTokens.color.primitive.text).toBe("#353535");
    expect(prototypeTokens.color.primitive.link).toBe("#005eb8");
    expect(prototypeTokens.color.primitive.lightFocus).toBe("#002e85");
    expect(prototypeTokens.color.primitive.lightBackground).toBe("#e6f6ff");
    expect(prototypeTokens.color.primitive.lightBackgroundAlt).toBe("#e3e7ea");
    expect(prototypeTokens.color.primitive.darkBackground).toBe("#005eb8");
    expect(prototypeTokens.color.primitive.darkBackgroundAlt).toBe("#001d74");
    expect(prototypeTokens.color.primitive.darkModeBackground).toBe("#000053");
    expect(prototypeTokens.color.primitive.darkVisitedLink).toBe("#ffffff");
  });

  it("exposes QHDS custom properties and stable SSQ aliases for components", () => {
    expect(prototypeTokens.color.qldVariables).toContain("--QLD-color-light__heading");
    expect(prototypeTokens.color.qldVariables).toContain("--QLD-color-dark__background--alt");
    expect(prototypeTokens.color.qldVariables).toContain("--QLD-underline__offset");
    expect(prototypeTokens.color.semanticVariables).toContain("--ssq-color-background");
    expect(prototypeTokens.color.semanticVariables).toContain("--ssq-color-heading");
    expect(prototypeTokens.color.semanticVariables).toContain("--ssq-color-action");
    expect(prototypeTokens.color.semanticVariables).toContain("--ssq-color-link");
    expect(prototypeTokens.color.semanticVariables).toContain("--ssq-color-error-border");
    expect(prototypeTokens.color.semanticVariables).toContain("--ssq-color-invalid-border");
    expect(prototypeTokens.color.semanticVariables).toContain("--ssq-color-info-text");
    expect(prototypeTokens.color.semanticVariables).toContain("--ssq-color-success-text");
    expect(prototypeTokens.color.semanticVariables).toContain("--ssq-color-warning-text");
    expect(prototypeTokens.color.semanticVariables).toContain("--ssq-color-header-background");
  });

  it("documents QHDS typography and spacing tokens", () => {
    expect(prototypeTokens.typography.fontFamilyBase).toContain("Noto Sans");
    expect(prototypeTokens.typography.fontFamilySiteTitle).toContain("Noto Sans");
    expect(prototypeTokens.typography.h1Desktop).toBe("3rem");
    expect(prototypeTokens.typography.h1DesktopLineHeight).toBe("3.75rem");
    expect(prototypeTokens.typography.h1Mobile).toBe("2rem");
    expect(prototypeTokens.typography.h2Mobile).toBe("1.75rem");
    expect(prototypeTokens.typography.h3).toBe("1.5rem");
    expect(prototypeTokens.typography.h6).toBe("0.875rem");
    expect(prototypeTokens.typography.fontWeightRegular).toBe(400);
    expect(prototypeTokens.typography.fontWeightSemibold).toBe(600);
    expect(prototypeTokens.typography.fontWeightBold).toBe(700);
    expect(prototypeTokens.typography.lineHeightParagraph).toBe(1.75);
    expect(prototypeTokens.typography.letterSpacingDefault).toBe(0);
    expect(prototypeTokens.layout.sectionPaddingDesktop).toBe("4rem");
    expect(prototypeTokens.layout.sectionPaddingMobile).toBe("2.25rem");
  });

  it("maps QHDS light, alt, dark and dark-alt layers in CSS", () => {
    expect(styles).toContain('--ssq-palette-name: "qld-health"');
    expect(styles).toContain("--QLD-color-light__heading: #000053");
    expect(styles).toContain("--QLD-color-light__text: #353535");
    expect(styles).toContain("--QLD-color-light__link: #005eb8");
    expect(styles).toContain("--QLD-color-light__focus: #002e85");
    expect(styles).toContain("--QLD-color-light__background: #e6f6ff");
    expect(styles).toContain("--QLD-color-light__background--alt: #e3e7ea");
    expect(styles).toContain("--QLD-color-dark__background: #005eb8");
    expect(styles).toContain("--QLD-color-dark__background--alt: #001d74");
    expect(styles).toContain("--ssq-color-background: var(--ssq-palette-default-background)");
    expect(styles).toContain("--ssq-palette-bright-background: var(--QLD-color-light__background)");
    expect(styles).toContain("--ssq-palette-alt-background: var(--QLD-color-light__background--alt)");
    expect(styles).toContain("--ssq-palette-bold-background: var(--QLD-color-dark__background)");
    expect(styles).toContain("--ssq-palette-bold-link-visited: var(--QLD-color-dark__link)");
    expect(styles).toContain("--ssq-palette-strong-background: var(--QLD-color-dark__background--alt)");
    expect(styles).toContain("--ssq-palette-strong-link-visited: var(--QLD-color-dark__link)");
    expect(styles).toContain("--ssq-palette-feedback-error: var(--QLD-color-status__error--darker)");
    expect(styles).toContain("--ssq-palette-feedback-error-border: var(--QLD-color-status__error)");
    expect(styles).toContain("--ssq-palette-feedback-warning-border: var(--QLD-color-status__caution--darker)");
    expect(styles).toContain("--ssq-palette-feedback-info-text: var(--QLD-color-light__text)");
    expect(styles).toContain("@media (prefers-color-scheme: dark)");
    expect(styles).toContain("--ssq-color-background: var(--ssq-primitive-color-black)");
    expect(styles).toContain("--ssq-color-link-visited: var(--ssq-palette-bold-link-visited)");
    expect(styles).toContain("--ssq-color-error: var(--QLD-color-status__error--lightest)");
    expect(styles).toContain("--ssq-color-invalid-border: var(--QLD-color-status__error--lightest)");
    expect(styles).toContain("--ssq-color-focus: var(--ssq-palette-bold-focus)");
  });

  it("keeps key CSS custom properties aligned with QHDS reference values", () => {
    expect(styles).toContain("--ssq-font-family-base: \"Noto Sans\"");
    expect(styles).toContain("--ssq-font-family-site-title: \"Noto Sans\"");
    expect(styles).toContain("--ssq-font-size-h1-mobile: 2rem");
    expect(styles).toContain("--ssq-font-size-h1-desktop: 3rem");
    expect(styles).toContain("--ssq-font-size-h2-mobile: 1.75rem");
    expect(styles).toContain("--ssq-font-size-h2-desktop: 2rem");
    expect(styles).toContain("--ssq-line-height-h1-desktop: 3.75rem");
    expect(styles).toContain("--ssq-line-height-h3: 2rem");
    expect(styles).toContain("--ssq-link-decoration-thickness: var(--QLD-underline__thickness-thin)");
    expect(styles).toContain("--ssq-link-decoration-thickness-hover: var(--QLD-underline__thickness-thick)");
    expect(styles).toContain("--ssq-link-decoration-offset: var(--QLD-underline__offset)");
    expect(styles).toContain("--ssq-section-padding-mobile: 2.25rem");
    expect(styles).toContain("--ssq-section-padding-desktop: 4rem");
  });
});
