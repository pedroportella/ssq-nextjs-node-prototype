import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { QhdsHeader } from "./QhdsHeader";

const styles = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "QhdsHeader.scss"), "utf8");

describe("QhdsHeader", () => {
  it("renders service name and primary navigation without Next.js dependencies", () => {
    const html = renderToStaticMarkup(
      <QhdsHeader navItems={[{ href: "/status", label: "Status" }]} serviceName="Header service" />
    );

    expect(html).toContain('class="qld__header ssq-header"');
    expect(html).toContain("qld__header__pre-header");
    expect(html).toContain("qld__header__main");
    expect(html).toContain('alt="Queensland Government"');
    expect(html).toContain("header-logo-qgov--brand.svg");
    expect(html).toContain("container-fluid");
    expect(html).toContain("row");
    expect(html).toContain("Header service");
    expect(html).toContain('href="/status"');
    expect(html).toContain('id="qld-header-main-nav"');
    expect(html).toContain('aria-label="Primary"');
  });

  it("keeps header links readable after visited state is applied", () => {
    expect(styles).toContain("--ssq-color-link: var(--ssq-color-header-text)");
    expect(styles).toContain("--ssq-color-link-decoration: var(--ssq-color-header-text)");
    expect(styles).toContain("--ssq-color-link-visited: var(--ssq-color-header-text)");
  });
});
