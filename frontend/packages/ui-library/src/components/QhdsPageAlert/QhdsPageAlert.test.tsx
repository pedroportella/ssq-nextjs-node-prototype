import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { QhdsPageAlert } from "./QhdsPageAlert";

describe("QhdsPageAlert", () => {
  it("renders a status alert with tone class", () => {
    const html = renderToStaticMarkup(
      <QhdsPageAlert heading="Saved" tone="success">
        <p>Your draft was saved.</p>
      </QhdsPageAlert>
    );

    expect(html).toContain('role="status"');
    expect(html).toContain("ssq-page-alert--success");
    expect(html).toContain("Saved");
    expect(html).toContain("Your draft was saved.");
  });
});
