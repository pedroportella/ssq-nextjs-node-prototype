import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { QhdsTextarea } from "./QhdsTextarea";

describe("QhdsTextarea", () => {
  it("renders label association and optional marker", () => {
    const html = renderToStaticMarkup(<QhdsTextarea id="notes" label="Notes" optional />);

    expect(html).toContain('for="notes"');
    expect(html).toContain('id="notes"');
    expect(html).toContain("<textarea");
    expect(html).toContain("qld__text-input");
    expect(html).toContain("qld__text-input--block");
    expect(html).toContain("optional");
  });
});
