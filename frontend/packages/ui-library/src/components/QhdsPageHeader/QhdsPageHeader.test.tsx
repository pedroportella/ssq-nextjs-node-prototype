import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { QhdsSummaryList } from "../QhdsSummaryList";
import { QhdsPageHeader } from "./QhdsPageHeader";

describe("QhdsPageHeader", () => {
  it("renders a stable page heading, abstract lead and optional aside", () => {
    const html = renderToStaticMarkup(
      <QhdsPageHeader
        aside={<QhdsSummaryList items={[{ description: "Avery Taylor", term: "Applicant" }]} />}
        contextLabel="Seniors Card"
        heading="Application status"
        headingId="application-status-title"
        lead="Track this prototype request."
      />
    );

    expect(html).toContain('class="ssq-page-header ssq-page-header--with-aside"');
    expect(html).toContain('id="application-status-title"');
    expect(html).toContain("<h1");
    expect(html).toContain("qld__abstract");
    expect(html).toContain("Seniors Card");
    expect(html).toContain("Applicant");
  });
});
