import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { QhdsFormField } from "./QhdsFormField";

describe("QhdsFormField", () => {
  it("renders label, hint, error and requirement markers", () => {
    const html = renderToStaticMarkup(
      <QhdsFormField
        error="Enter a name."
        errorId="full-name-error"
        hint="Use your legal name."
        hintId="full-name-hint"
        id="full-name"
        label="Full name"
        required
      >
        <input id="full-name" />
      </QhdsFormField>
    );

    expect(html).toContain('for="full-name"');
    expect(html).toContain("qld__form-group");
    expect(html).toContain("qld__label");
    expect(html).toContain("qld__hint-text");
    expect(html).toContain("qld__input--error");
    expect(html).toContain('id="full-name-hint"');
    expect(html).toContain('id="full-name-error"');
    expect(html).toContain("required");
    expect(html).toContain("ssq-form-field--invalid");
  });
});
