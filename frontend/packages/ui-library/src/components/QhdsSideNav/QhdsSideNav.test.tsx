import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { QhdsIcon } from "../QhdsIcon";
import { QhdsSideNav } from "./QhdsSideNav";

const styles = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "QhdsSideNav.scss"), "utf8");

describe("QhdsSideNav", () => {
  it("renders accessible QHDS-compatible left navigation with current page state", () => {
    const html = renderToStaticMarkup(
      <QhdsSideNav
        activeHref="/"
        heading="Home"
        headingHref="/"
        headingIcon={<QhdsIcon size="md" symbol="home" />}
        items={[
          { href: "/requests", label: "Requests", badge: "2" }
        ]}
      />
    );

    expect(html).toContain('class="qld__left-nav ssq-side-nav"');
    expect(html).toContain('id="left-nav"');
    expect(html).toContain("qld__left-nav__content");
    expect(html).toContain("qld__left-nav__item-link");
    expect(html).toContain("qld__left-nav__item-text");
    expect(html).toContain("qld__left-nav__item-icon");
    expect(html).toContain('class="qld__icon qld__icon--md"');
    expect(html).toContain('aria-label="left navigation"');
    expect(html).toContain('class="active ssq-side-nav__item"');
    expect(html).toContain('aria-current="page"');
    expect(html).toContain("Home");
    expect(html).toContain("Requests");
    expect(html).not.toContain("qld__side-nav");
  });

  it("renders nested accordion items when their parent is active", () => {
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

    expect(html).toContain("has-child");
    expect(html).toContain("qld__left-nav__item-link--open");
    expect(html).toContain("qld__left-nav__item-toggle qld__accordion--open");
    expect(html).toContain('aria-expanded="true"');
    expect(html).toContain('aria-controls="left-nav-requests-children"');
    expect(html).toContain('id="left-nav-requests-children"');
    expect(html).toContain("qld__accordion__body");
    expect(html).toContain("ssq-side-nav__list--nested");
    expect(html).toContain("Seniors Card");
  });

  it("keeps inactive accordion branches closed until expanded", () => {
    const html = renderToStaticMarkup(
      <QhdsSideNav
        items={[
          {
            href: "/requests",
            label: "Requests",
            items: [{ href: "/requests/seniors-card", label: "Seniors Card" }]
          }
        ]}
      />
    );

    expect(html).toContain("qld__left-nav__item-toggle qld__accordion--closed");
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain("qld__accordion--closed qld__accordion__body");
  });

  it("matches QGDS left navigation shell and accordion control styling", () => {
    expect(styles).toContain("--ssq-left-nav-background: rgb(245 245 245)");
    expect(styles).toContain("--ssq-left-nav-border: rgb(235 235 235)");
    expect(styles).toContain("box-sizing: border-box");
    expect(styles).toContain("border-right: var(--QLD-border-width-default) solid var(--ssq-left-nav-border)");
    expect(styles).toContain("box-shadow:\n    rgb(0 0 0 / 20%) 0 1px 2px,\n    rgb(0 0 0 / 10%) 0 1px 3px 1px");
    expect(styles).toContain("display: block");
    expect(styles).toContain("position: relative");
    expect(styles).toContain("height: 1.25rem");
    expect(styles).toContain("inset: 0");
    expect(styles).toContain("position: absolute");
    expect(styles).toContain("transform: rotate(-180deg)");
  });
});
