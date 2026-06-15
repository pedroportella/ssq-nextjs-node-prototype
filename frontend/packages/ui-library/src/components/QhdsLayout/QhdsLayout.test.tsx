import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { QhdsHeader } from "../QhdsHeader";
import { QhdsLayout } from "./QhdsLayout";

describe("QhdsLayout", () => {
  it("renders the app chrome with a skip link and stable main region", () => {
    const html = renderToStaticMarkup(
      <QhdsLayout footer={<footer>Footer</footer>} header={<header>Header</header>}>
        <h1>Body</h1>
      </QhdsLayout>
    );

    expect(html).toContain("qld__grid");
    expect(html).toContain("ssq-layout");
    expect(html).toContain('aria-label="skip links"');
    expect(html).toContain('href="#content"');
    expect(html).toContain('<main class="main ssq-layout__main" tabindex="-1">');
    expect(html).toContain('<section class="qld__body ssq-layout__body">');
    expect(html).toContain('class="col-xs-12 col-lg-12 col-xl-12 ssq-layout__content" id="content"');
    expect(html).toContain("Header");
    expect(html).toContain("Body");
    expect(html).toContain("Footer");
  });

  it("renders optional section navigation outside the main region", () => {
    const html = renderToStaticMarkup(
      <QhdsLayout sideNav={<nav aria-label="Account sections">Navigation</nav>}>
        <h1>Body</h1>
      </QhdsLayout>
    );

    expect(html).toContain('href="#section-navigation"');
    expect(html).toContain('class="col-xs-12 col-lg-3 col-xl-3 ssq-layout__sidebar" id="section-navigation"');
    expect(html).toContain('class="col-xs-12 col-lg-9 col-xl-9 ssq-layout__content" id="content"');
    expect(html).toContain('<nav aria-label="Account sections">Navigation</nav>');
  });

  it("hides section navigation in focus mode", () => {
    const html = renderToStaticMarkup(
      <QhdsLayout focusMode sideNav={<nav>Navigation</nav>}>
        <h1>Focused workflow</h1>
      </QhdsLayout>
    );

    expect(html).toContain("ssq-layout--focus");
    expect(html).not.toContain("ssq-layout__sidebar");
  });

  it("keeps skip-link ownership in the layout when composed with QhdsHeader", () => {
    const html = renderToStaticMarkup(
      <QhdsLayout header={<QhdsHeader />}>
        <h1>Body</h1>
      </QhdsLayout>
    );

    expect((html.match(/class="qld__skip-link ssq-layout__skip-links"/g) ?? []).length).toBe(1);
    expect((html.match(/role="banner"/g) ?? []).length).toBe(1);
  });
});
