import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { QhdsLayout } from "./QhdsLayout";

describe("QhdsLayout", () => {
  it("renders the app chrome with a skip link and stable main region", () => {
    const html = renderToStaticMarkup(
      <QhdsLayout footer={<footer>Footer</footer>} header={<header>Header</header>}>
        <h1>Body</h1>
      </QhdsLayout>
    );

    expect(html).toContain("ssq-layout");
    expect(html).toContain('href="#content"');
    expect(html).toContain('<main class="ssq-layout__main" id="content" tabindex="-1">');
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

    expect(html).toContain('<aside aria-label="Section navigation" class="ssq-layout__sidebar">');
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
});
