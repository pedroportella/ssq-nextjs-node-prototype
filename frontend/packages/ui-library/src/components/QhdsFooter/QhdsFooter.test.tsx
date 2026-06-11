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

    expect(html).toContain("<footer");
    expect(html).toContain("Footer service");
    expect(html).toContain("Review environment");
  });
});
