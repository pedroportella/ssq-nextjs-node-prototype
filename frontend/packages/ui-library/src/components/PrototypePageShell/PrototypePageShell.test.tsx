import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { PrototypePageShell } from "./PrototypePageShell";

describe("PrototypePageShell", () => {
  it("renders a heading, lead and shared landmark wrappers", () => {
    const html = renderToStaticMarkup(
      <PrototypePageShell lead="Use services online." title="Service dashboard">
        <p>Content</p>
      </PrototypePageShell>
    );

    expect(html).toContain("<header");
    expect(html).toContain("<main");
    expect(html).toContain("<footer");
    expect(html).toContain("Service dashboard");
    expect(html).toContain("Use services online.");
  });
});
