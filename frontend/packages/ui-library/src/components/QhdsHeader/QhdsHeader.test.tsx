import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { QhdsHeader } from "./QhdsHeader";

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
});
