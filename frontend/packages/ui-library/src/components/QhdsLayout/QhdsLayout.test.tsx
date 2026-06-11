import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { QhdsLayout } from "./QhdsLayout";

describe("QhdsLayout", () => {
  it("composes optional header, main content and footer slots", () => {
    const html = renderToStaticMarkup(
      <QhdsLayout footer={<footer>Footer</footer>} header={<header>Header</header>}>
        <main>Body</main>
      </QhdsLayout>
    );

    expect(html).toContain("ssq-layout");
    expect(html).toContain("Header");
    expect(html).toContain("Body");
    expect(html).toContain("Footer");
  });
});
