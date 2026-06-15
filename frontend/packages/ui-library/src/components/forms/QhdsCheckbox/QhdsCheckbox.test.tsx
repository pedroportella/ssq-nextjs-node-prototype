import { act } from "react";
import type { ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { QhdsCheckbox, QhdsCheckboxGroup } from "./QhdsCheckbox";

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

describe("QhdsCheckbox", () => {
  it("renders disabled, invalid and required states", () => {
    const html = renderToStaticMarkup(
      <QhdsCheckbox
        checked
        disabled
        error="You must accept the declaration."
        hint="Read the declaration before continuing."
        id="declaration"
        label="I agree"
        required
      />
    );

    expect(html).toContain('type="checkbox"');
    expect(html).toContain('for="declaration"');
    expect(html).toContain('checked=""');
    expect(html).toContain('readOnly=""');
    expect(html).toContain("qld__form-group");
    expect(html).toContain("qld__control-input");
    expect(html).toContain("qld__control-input--block");
    expect(html).toContain("qld__control-input__input");
    expect(html).toContain("qld__control-input__text");
    expect(html).toContain("qld__input--error");
    expect(html).toContain("ssq-checkbox--disabled");
    expect(html).toContain("ssq-checkbox--invalid");
    expect(html).toContain('disabled=""');
    expect(html).toContain('aria-invalid="true"');
    expect(html).toContain('aria-describedby="declaration-hint declaration-error"');
    expect(html).toContain("Read the declaration before continuing.");
    expect(html).toContain("You must accept the declaration.");
  });

  it("renders grouped checkbox fields with fieldset and described-by wiring", () => {
    const html = renderToStaticMarkup(
      <QhdsCheckboxGroup
        error="Select at least one support type."
        hint="Select all support types that apply."
        id="support-types"
        legend="Support types"
        name="supportTypes"
        options={[
          { defaultChecked: true, hint: "Bond assistance for a new tenancy.", label: "Bond assistance", value: "bond" },
          { disabled: true, label: "Rent arrears", value: "rent-arrears" }
        ]}
        required
      />
    );

    expect(html).toContain('<fieldset');
    expect(html).toContain("qld__checkboxes");
    expect(html).toContain("qld__control-group");
    expect(html).toContain('role="group"');
    expect(html).toContain('aria-labelledby="support-types-legend"');
    expect(html).toContain('aria-describedby="support-types-hint support-types-error"');
    expect(html).toContain('aria-required="true"');
    expect(html).toContain('<legend class="qld__fieldset__legend ssq-checkbox-group__legend" id="support-types-legend"');
    expect(html).toContain('id="support-types-hint"');
    expect(html).toContain('id="support-types-error"');
    expect(html).toContain('role="status"');
    expect(html).toContain('name="supportTypes"');
    expect(html).toContain('id="support-types-bond"');
    expect(html).toContain('for="support-types-bond"');
    expect(html).toContain('value="bond"');
    expect(html).toContain('checked=""');
    expect(html).toContain('aria-describedby="support-types-hint support-types-error support-types-bond-hint"');
    expect(html).toContain('id="support-types-bond-hint"');
    expect(html).toContain('id="support-types-rent-arrears"');
    expect(html).toContain('disabled=""');
    expect(html).toContain("Select at least one support type.");
  });

  it("marks controlled checkbox groups as readonly when no change handler is supplied", () => {
    const html = renderToStaticMarkup(
      <QhdsCheckboxGroup
        id="contact-methods"
        legend="Contact methods"
        options={[
          { label: "Email", value: "email" },
          { label: "Phone", value: "phone" }
        ]}
        value={["email"]}
      />
    );

    expect(html).toContain('id="contact-methods-email"');
    expect(html).toContain('checked=""');
    expect(html).toContain('readOnly=""');
  });

  it("emits grouped checkbox changes with the current checked values", () => {
    const onChange = vi.fn();
    const element = renderInteractive(
      <QhdsCheckboxGroup
        defaultValue={["email"]}
        id="contact-methods"
        legend="Contact methods"
        name="contactMethods"
        onChange={onChange}
        options={[
          { label: "Email", value: "email" },
          { label: "Phone", value: "phone" }
        ]}
      />
    );
    const phone = element.querySelector<HTMLInputElement>("#contact-methods-phone");

    act(() => {
      phone?.click();
    });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith("phone", true, ["email", "phone"], expect.any(Object));
  });
});
