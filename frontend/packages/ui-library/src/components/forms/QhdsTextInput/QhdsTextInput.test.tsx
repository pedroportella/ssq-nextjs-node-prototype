import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { QhdsTextInput } from "./QhdsTextInput";

describe("QhdsTextInput", () => {
  it("associates input with labels, hints and errors", () => {
    const html = renderToStaticMarkup(
      <QhdsTextInput
        error="Enter your full name."
        hint="Use your legal name."
        id="full-name"
        label="Full name"
        name="fullName"
        required
      />
    );

    expect(html).toContain('for="full-name"');
    expect(html).toContain('id="full-name"');
    expect(html).toContain('id="full-name-hint"');
    expect(html).toContain('id="full-name-error"');
    expect(html).toContain('aria-describedby="full-name-hint full-name-error"');
    expect(html).toContain('aria-invalid="true"');
    expect(html).toContain("required");
  });
});
