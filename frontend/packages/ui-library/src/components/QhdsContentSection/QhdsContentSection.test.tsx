import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { QhdsContentSection } from "./QhdsContentSection";

describe("QhdsContentSection", () => {
  it("renders a QHDS body section with labelled heading and content", () => {
    const html = renderToStaticMarkup(
      <QhdsContentSection heading="Request summary" lead="Review the submitted request.">
        <p>Reference SC-2026-0001</p>
      </QhdsContentSection>
    );

    expect(html).toContain("qld__body");
    expect(html).toContain("ssq-content-section");
    expect(html).toContain('aria-labelledby="request-summary-section"');
    expect(html).toContain("<h2");
    expect(html).toContain("qld__abstract");
    expect(html).toContain("Reference SC-2026-0001");
  });
});
