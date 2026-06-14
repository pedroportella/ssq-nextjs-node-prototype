import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { QhdsPageAlert } from "./QhdsPageAlert";

const styles = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "QhdsPageAlert.scss"), "utf8");

describe("QhdsPageAlert", () => {
  it("renders a status alert with tone class", () => {
    const html = renderToStaticMarkup(
      <QhdsPageAlert heading="Saved" tone="success">
        <p>Your draft was saved.</p>
      </QhdsPageAlert>
    );

    expect(html).toContain('role="status"');
    expect(html).toContain("qld__page-alerts");
    expect(html).toContain("qld__page-alerts--success");
    expect(html).toContain("qld__page-alerts--heading");
    expect(html).toContain("ssq-page-alert--success");
    expect(html).toContain("Saved");
    expect(html).toContain("Your draft was saved.");
  });

  it("pins readable feedback foreground tokens for light alert panels", () => {
    expect(styles).toContain("--ssq-color-heading: var(--ssq-color-info-text)");
    expect(styles).toContain("--ssq-color-heading: var(--ssq-color-success-text)");
    expect(styles).toContain("--ssq-color-heading: var(--ssq-color-warning-text)");
    expect(styles).toContain("color: var(--ssq-color-info-text)");
    expect(styles).toContain("color: var(--ssq-color-success-text)");
    expect(styles).toContain("color: var(--ssq-color-warning-text)");
  });
});
