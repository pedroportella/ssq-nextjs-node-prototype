import { act } from "react";
import type { ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { QhdsRadioGroup } from "./QhdsRadioGroup";

let root: Root | undefined;
let container: HTMLDivElement | undefined;

function renderInteractive(element: ReactNode) {
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);

  act(() => {
    root?.render(element);
  });

  return container;
}

afterEach(() => {
  act(() => {
    root?.unmount();
  });
  container?.remove();
  root = undefined;
  container = undefined;
});

describe("QhdsRadioGroup", () => {
  it("renders options with label associations and group descriptions", () => {
    const html = renderToStaticMarkup(
      <QhdsRadioGroup
        aria-describedby="external-help"
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
    expect(html).toContain("qld__control-input--block");
    expect(html).toContain("qld__control-input__input");
    expect(html).toContain("qld__control-input__text");
    expect(html).toContain("qld__input--error");
    expect(html).toContain('role="radiogroup"');
    expect(html).toContain('aria-labelledby="age-eligible-legend"');
    expect(html).toContain('aria-required="true"');
    expect(html).toContain('aria-describedby="external-help age-eligible-hint age-eligible-error"');
    expect(html).toContain('<legend class="qld__fieldset__legend ssq-radio-group__legend" id="age-eligible-legend"');
    expect(html).toContain('id="age-eligible-hint"');
    expect(html).toContain('id="age-eligible-error"');
    expect(html).toContain('role="status"');
    expect(html).toContain('id="age-eligible-yes"');
    expect(html).toContain('for="age-eligible-yes"');
    expect(html).toContain('name="ageEligible"');
    expect(html).toContain('value="yes"');
    expect(html).toContain('checked=""');
    expect(html).toContain('required=""');
    expect(html).toContain('aria-describedby="external-help age-eligible-hint age-eligible-error age-eligible-yes-hint"');
    expect(html).toContain('id="age-eligible-yes-hint"');
    expect(html).toContain("Select one option.");
  });

  it("renders disabled groups and disabled options", () => {
    const html = renderToStaticMarkup(
      <QhdsRadioGroup
        defaultValue="email"
        disabled
        id="contact-method"
        legend="Contact method"
        options={[
          { label: "Email", value: "email" },
          { disabled: true, label: "Phone", value: "phone" }
        ]}
      />
    );

    expect(html).toContain('<fieldset aria-labelledby="contact-method-legend"');
    expect(html).toContain("ssq-radio-group--disabled");
    expect(html).toContain('disabled=""');
    expect(html).toContain('id="contact-method-email"');
    expect(html).toContain('id="contact-method-phone"');
  });

  it("marks controlled radio groups as readonly when no change handler is supplied", () => {
    const html = renderToStaticMarkup(
      <QhdsRadioGroup
        id="contact-method"
        legend="Contact method"
        options={[
          { label: "Email", value: "email" },
          { label: "Phone", value: "phone" }
        ]}
        value="phone"
      />
    );

    expect(html).toContain('id="contact-method-phone"');
    expect(html).toContain('checked=""');
    expect(html).toContain('readOnly=""');
  });

  it("renders optional text without requiring an option", () => {
    const html = renderToStaticMarkup(
      <QhdsRadioGroup
        id="preferred-contact"
        legend="Preferred contact"
        optional
        options={[
          { label: "Email", value: "email" },
          { label: "Phone", value: "phone" }
        ]}
      />
    );

    expect(html).toContain("optional");
    expect(html).not.toContain('required=""');
    expect(html).not.toContain('aria-required="true"');
  });

  it("emits controlled radio changes with the selected value", () => {
    const onChange = vi.fn();
    const element = renderInteractive(
      <QhdsRadioGroup
        id="contact-method"
        legend="Contact method"
        name="contactMethod"
        onChange={onChange}
        options={[
          { label: "Email", value: "email" },
          { label: "Phone", value: "phone" }
        ]}
        value="email"
      />
    );
    const phone = element.querySelector<HTMLInputElement>("#contact-method-phone");

    act(() => {
      phone?.click();
    });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith("phone", expect.any(Object));
  });
});
