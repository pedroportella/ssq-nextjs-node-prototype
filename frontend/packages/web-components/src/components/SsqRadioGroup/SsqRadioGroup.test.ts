import { describe, expect, it } from "vitest";

import { fixture } from "../../internal/testHelpers";
import "./SsqRadioGroup";

describe("ssq-radio-group", () => {
  it("renders radio options inside a fieldset", async () => {
    const element = await fixture(document.createElement("ssq-radio-group"));
    element.id = "eligibility";
    element.label = "Are you eligible?";
    element.options = [
      { label: "Yes", value: "yes" },
      { label: "No", value: "no" }
    ];
    await element.updateComplete;

    const fieldset = element.shadowRoot?.querySelector("fieldset");
    const legend = element.shadowRoot?.querySelector("legend");
    const radios = element.shadowRoot?.querySelectorAll('input[type="radio"]');
    const labels = element.shadowRoot?.querySelectorAll("label");

    expect(fieldset?.classList.contains("qld__form-group")).toBe(true);
    expect(fieldset?.classList.contains("ssq-radio-group")).toBe(true);
    expect(legend?.classList.contains("qld__label")).toBe(true);
    expect(radios).toHaveLength(2);
    expect(radios?.[0].classList.contains("qld__control-input__input")).toBe(true);
    expect(radios?.[0].getAttribute("name")).toBe("eligibility");
    expect(labels?.[0].classList.contains("qld__control-input__text")).toBe(true);
  });

  it("emits selected radio value details", async () => {
    const element = await fixture(document.createElement("ssq-radio-group"));
    element.options = [
      { label: "Yes", value: "yes" },
      { label: "No", value: "no" }
    ];
    await element.updateComplete;
    const events: CustomEvent[] = [];
    element.addEventListener("ssq-change", (event) => events.push(event as CustomEvent));

    const radio = element.shadowRoot?.querySelector('input[value="no"]') as HTMLInputElement;
    radio.checked = true;
    radio.dispatchEvent(new Event("change", { bubbles: true }));

    expect(events[0].detail).toEqual({ value: "no" });
  });
});
