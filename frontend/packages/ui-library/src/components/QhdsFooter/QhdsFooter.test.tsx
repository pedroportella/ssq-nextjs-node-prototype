import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { QhdsFooter } from "./QhdsFooter";

describe("QhdsFooter", () => {
  it("renders service name and optional content", () => {
    const html = renderToStaticMarkup(
      <QhdsFooter serviceName="Footer service">
        <p>Review environment</p>
      </QhdsFooter>
    );

    expect(html).toContain('class="qld__footer qld__footer--dark-alt ssq-footer"');
    expect(html).toContain("container-fluid");
    expect(html).toContain("qld__footer__row");
    expect(html).toContain("qld__footer__heading");
    expect(html).toContain("Footer service");
    expect(html).toContain("Review environment");
  });
});
