import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { QhdsHeader } from "../QhdsHeader";
import { QhdsLayout } from "./QhdsLayout";

const styles = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "QhdsLayout.scss"), "utf8");

describe("QhdsLayout", () => {
  it("renders the app chrome with a skip link and stable main region", () => {
    const html = renderToStaticMarkup(
      <QhdsLayout footer={<footer>Footer</footer>} header={<header>Header</header>}>
        <h1>Body</h1>
      </QhdsLayout>
    );

    expect(html).toContain("qld__grid");
    expect(html).toContain("ssq-layout");
    expect(html).toContain("ssq-layout--app");
    expect(html).toContain('aria-label="skip links"');
    expect(html).toContain('href="#content"');
    expect(html).toContain('<main class="main ssq-layout__main" tabindex="-1">');
    expect(html).toContain('<section class="qld__body ssq-layout__body">');
    expect(html).toContain('class="container-fluid ssq-layout__container"');
    expect(html).toContain('class="col-xs-12 col-lg-12 col-xl-12 ssq-layout__content ssq-layout__content--full" id="content"');
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
    expect(html).toContain('class="col-xs-12 col-lg-9 col-xl-9 ssq-layout__content ssq-layout__content--full" id="content"');
    expect(html).toContain('<nav aria-label="Account sections">Navigation</nav>');
  });

  it("hides section navigation in focus mode", () => {
    const html = renderToStaticMarkup(
      <QhdsLayout focusMode sideNav={<nav>Navigation</nav>}>
        <h1>Focused workflow</h1>
      </QhdsLayout>
    );

    expect(html).toContain("ssq-layout--focus");
    expect(html).toContain("ssq-layout__content--task");
    expect(html).not.toContain("ssq-layout__sidebar");
  });

  it("supports contained body-width content while preserving the stable content target", () => {
    const html = renderToStaticMarkup(
      <QhdsLayout contentLabelledBy="page-title" contentWidth="body" width="contained">
        <h1 id="page-title">Readable page</h1>
      </QhdsLayout>
    );

    expect(html).toContain("ssq-layout--contained");
    expect(html).toContain("ssq-layout__content--body");
    expect(html).toContain('aria-labelledby="page-title"');
    expect(html).toContain('id="content"');
    expect(styles).toContain(".ssq-layout--app .ssq-layout__container");
    expect(styles).toContain("max-width: none");
    expect(styles).toContain("padding-left: 2rem");
    expect(styles).toContain(".ssq-layout--contained .ssq-layout__container");
    expect(styles).toContain("max-width: var(--qld-grid-container-max-width)");
    expect(styles).toContain(".ssq-layout__content--task");
    expect(styles).toContain("max-width: 76rem");
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
