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
      />
    );

    expect(html).toContain('class="ssq-table"');
    expect(html).toContain('tabindex="0"');
    expect(html).toContain("<caption>Recent activity</caption>");
    expect(html).toContain('scope="col"');
    expect(html).toContain('data-label="Date"');
  });
});
