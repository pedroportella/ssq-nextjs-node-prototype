import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { QhdsCheckbox } from "./QhdsCheckbox";

describe("QhdsCheckbox", () => {
  it("renders disabled, invalid and required states", () => {
    const html = renderToStaticMarkup(
      <QhdsCheckbox disabled error="You must accept the declaration." id="declaration" label="I agree" required />
    );

    expect(html).toContain('type="checkbox"');
    expect(html).toContain('for="declaration"');
    expect(html).toContain("qld__form-group");
    expect(html).toContain("qld__control-input");
    expect(html).toContain("qld__control-input__input");
    expect(html).toContain("qld__control-input__text");
    expect(html).toContain("qld__input--error");
    expect(html).toContain("ssq-checkbox--disabled");
    expect(html).toContain("ssq-checkbox--invalid");
    expect(html).toContain('disabled=""');
    expect(html).toContain('aria-invalid="true"');
    expect(html).toContain("You must accept the declaration.");
  });
});
