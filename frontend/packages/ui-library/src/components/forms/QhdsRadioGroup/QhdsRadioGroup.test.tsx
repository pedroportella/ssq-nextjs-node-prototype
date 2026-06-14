import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { QhdsRadioGroup } from "./QhdsRadioGroup";

describe("QhdsRadioGroup", () => {
  it("renders options with label associations and group descriptions", () => {
    const html = renderToStaticMarkup(
      <QhdsRadioGroup
        defaultValue="yes"
        error="Select one option."
        hint="Choose the answer that applies."
        id="age-eligible"
        legend="Are you eligible?"
        name="ageEligible"
        options={[
          { hint: "You meet the age requirement.", label: "Yes", value: "yes" },
          { label: "No", value: "no" }
        ]}
        required
      />
    );

    expect(html).toContain("<fieldset");
    expect(html).toContain("<legend");
    expect(html).toContain("qld__form-group");
    expect(html).toContain("qld__radio-buttons");
    expect(html).toContain("qld__fieldset__legend");
    expect(html).toContain("qld__control-group");
    expect(html).toContain("qld__control-input");
    expect(html).toContain("qld__control-input__input");
    expect(html).toContain("qld__control-input__text");
    expect(html).toContain("qld__input--error");
    expect(html).toContain('id="age-eligible-yes"');
    expect(html).toContain('for="age-eligible-yes"');
    expect(html).toContain('checked=""');
    expect(html).toContain('aria-describedby="age-eligible-hint age-eligible-error"');
    expect(html).toContain('aria-describedby="age-eligible-yes-hint"');
    expect(html).toContain("Select one option.");
  });
});
