import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { QhdsSummaryList } from "./QhdsSummaryList";

describe("QhdsSummaryList", () => {
  it("renders QHDS summary-list hooks with term and description pairs", () => {
    const html = renderToStaticMarkup(
      <QhdsSummaryList
        ariaLabel="Request summary"
        items={[
          { description: "SC-2026-0001", term: "Reference" },
          { description: "Approved", term: "Status" }
        ]}
      />
    );

    expect(html).toContain('aria-label="Request summary"');
    expect(html).toContain("qld__summary-list");
    expect(html).toContain("qld__summary-list__row");
    expect(html).toContain("<dt");
    expect(html).toContain("<dd");
    expect(html).toContain("SC-2026-0001");
  });
});
