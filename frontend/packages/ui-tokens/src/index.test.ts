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
  it("documents the selected QGDS-shaped token boundary", () => {
    expect(prototypeTokens.source).toBe("qgds-shaped-css-snapshot");
    expect(prototypeTokens.selectedPalette).toBe("qld-corporate");
    expect(prototypeTokens.color.primitive.blue700).toBe("#315870");
    expect(prototypeTokens.space[8]).toBe("2rem");
  });

  it("exposes stable semantic variables for components", () => {
    expect(prototypeTokens.color.semanticVariables).toContain("--ssq-color-background");
    expect(prototypeTokens.color.semanticVariables).toContain("--ssq-color-action");
    expect(prototypeTokens.color.semanticVariables).toContain("--ssq-color-header-background");
  });

  it("maps light and dark theme layers in CSS", () => {
    expect(styles).toContain('--ssq-palette-name: "qld-corporate"');
    expect(styles).toContain("--ssq-palette-bright-background");
    expect(styles).toContain("--ssq-palette-strong-background");
    expect(styles).toContain("--ssq-color-background: var(--ssq-palette-bright-background)");
    expect(styles).toContain("@media (prefers-color-scheme: dark)");
    expect(styles).toContain("--ssq-color-background: var(--ssq-palette-strong-background)");
    expect(styles).toContain('[data-ssq-theme="dark"]');
  });
});
