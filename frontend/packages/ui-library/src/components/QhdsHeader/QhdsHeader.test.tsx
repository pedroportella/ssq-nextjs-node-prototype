import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { QhdsHeader } from "./QhdsHeader";

describe("QhdsHeader", () => {
  it("renders service name and primary navigation without Next.js dependencies", () => {
    const html = renderToStaticMarkup(
      <QhdsHeader navItems={[{ href: "/status", label: "Status" }]} serviceName="Header service" />
    );

    expect(html).toContain("<header");
    expect(html).toContain("Header service");
    expect(html).toContain('href="/status"');
    expect(html).toContain('aria-label="Primary"');
  });
});
