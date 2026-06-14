import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const themeCss = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "theme.css"), "utf8");

describe("QHDS theme entrypoint", () => {
  it("applies QHDS typography, link and focus tokens globally", () => {
    expect(themeCss).toContain("font-family: var(--ssq-font-family-base)");
    expect(themeCss).toContain("font-family: var(--ssq-font-family-heading)");
    expect(themeCss).toContain("font-weight: var(--ssq-font-weight-semibold)");
    expect(themeCss).toContain("font-size: var(--ssq-font-size-h1-mobile)");
    expect(themeCss).toContain("line-height: var(--ssq-line-height-h1-mobile)");
    expect(themeCss).toContain("font-size: var(--ssq-font-size-h1-desktop)");
    expect(themeCss).toContain("line-height: var(--ssq-line-height-h1-desktop)");
    expect(themeCss).toContain("font-size: var(--ssq-font-size-h2-mobile)");
    expect(themeCss).toContain("font-size: var(--ssq-font-size-h2-desktop)");
    expect(themeCss).toContain("font-size: var(--ssq-font-size-h3-mobile)");
    expect(themeCss).toContain("line-height: var(--ssq-line-height-h3)");
    expect(themeCss).toContain("font-size: var(--ssq-font-size-h6-mobile)");
    expect(themeCss).toContain("line-height: var(--ssq-line-height-h6)");
    expect(themeCss).toContain("letter-spacing: var(--ssq-letter-spacing-default)");
    expect(themeCss).toContain("color: var(--ssq-color-link)");
    expect(themeCss).toContain("text-decoration-thickness: var(--ssq-link-decoration-thickness)");
    expect(themeCss).toContain("text-decoration-thickness: var(--ssq-link-decoration-thickness-hover)");
    expect(themeCss).toContain("outline: 3px solid var(--ssq-color-focus)");
    expect(themeCss).toContain("outline-offset: 2px");
  });

  it("mirrors QHDS body, abstract and display rhythm", () => {
    expect(themeCss).toContain(".qld__body p");
    expect(themeCss).toContain("line-height: var(--ssq-line-height-paragraph)");
    expect(themeCss).toContain(".qld__body *:not([type=\"hidden\"]) + p");
    expect(themeCss).toContain("margin-top: var(--ssq-paragraph-spacing-body)");
    expect(themeCss).toContain(".qld__abstract");
    expect(themeCss).toContain("font-size: var(--ssq-font-size-lead-mobile)");
    expect(themeCss).toContain("font-size: var(--ssq-font-size-lead-desktop)");
    expect(themeCss).toContain(".qld__display-xxxl");
    expect(themeCss).toContain("font-size: 3rem");
  });

  it("exposes QHDS light, alternate and dark body surface hooks", () => {
    expect(themeCss).toContain(".qld__body--light");
    expect(themeCss).toContain(".qld__body--alt");
    expect(themeCss).toContain(".qld__body--dark");
    expect(themeCss).toContain(".qld__body--dark-alt");
    expect(themeCss).toContain(".qld__footer--dark-alt");
    expect(themeCss).toContain("--ssq-color-heading: var(--ssq-palette-bright-heading)");
    expect(themeCss).toContain("--ssq-color-background: var(--ssq-palette-alt-background)");
    expect(themeCss).toContain("--ssq-color-background: var(--ssq-palette-bold-background)");
    expect(themeCss).toContain("--ssq-color-background: var(--ssq-palette-strong-background)");
    expect(themeCss).toContain("--ssq-color-link-visited: var(--ssq-palette-bold-link-visited)");
    expect(themeCss).toContain("--ssq-color-link-visited: var(--ssq-palette-strong-link-visited)");
    expect(themeCss).toContain("--ssq-color-action: var(--ssq-palette-bright-action)");
    expect(themeCss).toContain("--ssq-color-error: var(--ssq-palette-feedback-error)");
    expect(themeCss).toContain("--ssq-color-error: var(--QLD-color-status__error--lightest)");
    expect(themeCss).toContain("--ssq-color-invalid-border: var(--ssq-palette-feedback-error)");
    expect(themeCss).toContain("--ssq-color-invalid-border: var(--QLD-color-status__error--lightest)");
  });
});
