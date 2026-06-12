import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { QhdsSideNav } from "./QhdsSideNav";

describe("QhdsSideNav", () => {
  it("renders accessible QHDS-compatible side navigation with current page state", () => {
    const html = renderToStaticMarkup(
      <QhdsSideNav
        activeHref="/requests"
        heading="My account"
        items={[
          { href: "/", label: "Home" },
          { href: "/requests", label: "Requests", badge: "2" }
        ]}
      />
    );

    expect(html).toContain('class="qld__side-nav ssq-side-nav"');
    expect(html).toContain('aria-label="Section navigation"');
    expect(html).toContain('aria-current="page"');
    expect(html).toContain("My account");
    expect(html).toContain("Requests");
  });

  it("renders nested items when their parent is active", () => {
    const html = renderToStaticMarkup(
      <QhdsSideNav
        activeHref="/requests/seniors-card"
        items={[
          {
            href: "/requests",
            label: "Requests",
            items: [{ href: "/requests/seniors-card", label: "Seniors Card" }]
          }
        ]}
      />
    );

    expect(html).toContain("ssq-side-nav__list--nested");
    expect(html).toContain("Seniors Card");
  });
});
