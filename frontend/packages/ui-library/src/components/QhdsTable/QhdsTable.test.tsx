import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { QhdsTable } from "./QhdsTable";

describe("QhdsTable", () => {
  it("renders a captioned responsive table with column headers", () => {
    const html = renderToStaticMarkup(
      <QhdsTable
        caption="Recent activity"
        captionDescription="Example table ordered by activity date."
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
    expect(html).toContain("qld__table--contained");
    expect(html).toContain("qld__table--striped");
    expect(html).toContain("qld__table__wrapper");
    expect(html).toContain("qld__align-middle");
    expect(html).toContain("qld__table__caption");
    expect(html).toContain("qld__caption");
    expect(html).toContain("qld__table__header");
    expect(html).toContain("qld__table__cell");
    expect(html).toContain('tabindex="0"');
    expect(html).toContain(">Recent activity<span");
    expect(html).toContain("Example table ordered by activity date.");
    expect(html).toContain('scope="col"');
    expect(html).toContain('data-label="Date"');
  });

  it("can render a simple uncontained table without a scroll focus target", () => {
    const html = renderToStaticMarkup(
      <QhdsTable
        caption="Simple table"
        columns={[{ header: "Name", key: "name" }]}
        contained={false}
        rows={[{ id: "one", name: "One" }]}
        scroll={false}
      />
    );

    expect(html).toContain('class="qld__table__wrapper ssq-table"');
    expect(html).not.toContain("qld__table--contained");
    expect(html).not.toContain("qld__table--scroll");
    expect(html).not.toContain("tabindex");
  });
});
