import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { QhdsButton } from "./QhdsButton";

describe("QhdsButton", () => {
  it("renders anchor and button variants", () => {
    const html = renderToStaticMarkup(
      <>
        <QhdsButton href="/start">Start</QhdsButton>
        <QhdsButton variant="secondary">Cancel</QhdsButton>
      </>
    );

    expect(html).toContain('href="/start"');
    expect(html).toContain("qld__btn");
    expect(html).toContain("qld__btn--primary");
    expect(html).toContain("qld__btn--secondary");
    expect(html).toContain("ssq-button--primary");
    expect(html).toContain("ssq-button--secondary");
    expect(html).toContain('type="button"');
  });
});
