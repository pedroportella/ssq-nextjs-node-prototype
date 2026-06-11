import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { webComponentPackageStatus } from "./index";

const srcDir = dirname(fileURLToPath(import.meta.url));
const styleFiles = [
  "components/SsqAlert/SsqAlert.styles.ts",
  "components/SsqButton/SsqButton.styles.ts",
  "components/SsqCheckbox/SsqCheckbox.styles.ts",
  "components/SsqFormField/SsqFormField.styles.ts",
  "components/SsqRadioGroup/SsqRadioGroup.styles.ts",
  "components/SsqSelect/SsqSelect.styles.ts",
  "components/SsqTextInput/SsqTextInput.styles.ts"
];

describe("web component package", () => {
  it("registers the first core component batch", () => {
    expect(webComponentPackageStatus.status).toBe("core-components-registered");
    expect(webComponentPackageStatus.componentCount).toBe(7);
    expect(customElements.get("ssq-button")).toBeDefined();
    expect(customElements.get("ssq-text-input")).toBeDefined();
    expect(customElements.get("ssq-alert")).toBeDefined();
  });

  it("keeps component styles on semantic token variables", () => {
    const styles = styleFiles
      .map((file) => readFileSync(join(srcDir, file), "utf8"))
      .join("\n");

    expect(styles).toContain("var(--ssq-color");
    expect(styles).not.toMatch(/#[0-9a-fA-F]{3,8}/);
    expect(styles).not.toContain("--ssq-palette-");
    expect(styles).not.toContain("--ssq-primitive-");
  });
});
