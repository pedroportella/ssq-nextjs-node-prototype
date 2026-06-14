import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { QhdsDirectionLink } from "./QhdsDirectionLink";

describe("QhdsDirectionLink", () => {
  it("renders a QHDS direction link with the requested direction", () => {
    const html = renderToStaticMarkup(
      <QhdsDirectionLink direction="right" href="/next">
        Next step
      </QhdsDirectionLink>
    );

    expect(html).toContain('href="/next"');
    expect(html).toContain("qld__direction-link");
    expect(html).toContain("qld__direction-link--right");
    expect(html).toContain("Next step");
  });
});
