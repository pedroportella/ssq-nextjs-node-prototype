import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { QhdsTable } from "./QhdsTable";

describe("QhdsTable", () => {
  it("renders a captioned responsive table with column headers", () => {
    const html = renderToStaticMarkup(
      <QhdsTable
        caption="Recent activity"
        columns={[
          { header: "Date", key: "date" },
          { header: "Activity", key: "activity" }
        ]}
        rows={[
          { activity: "Submitted", date: "12 Jun 2026", id: "submitted" },
          { activity: "Received", date: "12 Jun 2026", id: "received" }
        ]}
        striped
      />
    );

    expect(html).toContain("qld__table--scroll");
    expect(html).toContain("qld__table--striped");
    expect(html).toContain("qld__table__caption");
    expect(html).toContain("qld__table__header");
    expect(html).toContain("qld__table__cell");
    expect(html).toContain('tabindex="0"');
    expect(html).toContain(">Recent activity</caption>");
    expect(html).toContain('scope="col"');
    expect(html).toContain('data-label="Date"');
  });
});
