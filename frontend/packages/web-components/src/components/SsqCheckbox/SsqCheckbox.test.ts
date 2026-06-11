import { describe, expect, it } from "vitest";

import { fixture } from "../../internal/testHelpers";
import "./SsqCheckbox";

describe("ssq-checkbox", () => {
  it("renders a labelled checkbox with QGDS-compatible control class", async () => {
    const element = await fixture(document.createElement("ssq-checkbox"));
    element.id = "confirm";
    element.label = "I confirm";
    element.required = true;
    await element.updateComplete;

    const input = element.shadowRoot?.querySelector("input");
    const label = element.shadowRoot?.querySelector("label");

    expect(input?.classList.contains("qld__control-input__input")).toBe(true);
    expect(input?.required).toBe(true);
    expect(label?.getAttribute("for")).toBe("confirm");
  });

  it("emits checked state details", async () => {
    const element = await fixture(document.createElement("ssq-checkbox"));
    element.value = "yes";
    await element.updateComplete;
    const events: CustomEvent[] = [];
    element.addEventListener("ssq-change", (event) => events.push(event as CustomEvent));

    const input = element.shadowRoot?.querySelector("input") as HTMLInputElement;
    input.checked = true;
    input.dispatchEvent(new Event("change", { bubbles: true }));

    expect(events[0].detail).toEqual({ checked: true, value: "yes" });
  });
});
