import { describe, expect, it } from "vitest";

import { fixture } from "../../internal/testHelpers";
import "./SsqSelect";

describe("ssq-select", () => {
  it("renders options and QGDS-compatible select class", async () => {
    const element = await fixture(document.createElement("ssq-select"));
    element.id = "state";
    element.label = "State";
    element.options = [
      { label: "Queensland", value: "qld" },
      { label: "Victoria", value: "vic" }
    ];
    await element.updateComplete;

    const select = element.shadowRoot?.querySelector("select");
    const label = element.shadowRoot?.querySelector("label");
    const options = element.shadowRoot?.querySelectorAll("option");

    expect(label?.classList.contains("qld__label")).toBe(true);
    expect(label?.getAttribute("for")).toBe("state");
    expect(select?.classList.contains("qld__select-control")).toBe(true);
    expect(select?.getAttribute("id")).toBe("state");
    expect(select?.getAttribute("aria-invalid")).toBe("false");
    expect(options).toHaveLength(2);
    expect(options?.[0].textContent).toBe("Queensland");
  });

  it("emits selected value details", async () => {
    const element = await fixture(document.createElement("ssq-select"));
    element.options = [
      { label: "Queensland", value: "qld" },
      { label: "Victoria", value: "vic" }
    ];
    await element.updateComplete;

    const events: CustomEvent[] = [];
    element.addEventListener("ssq-change", (event) => events.push(event as CustomEvent));

    const select = element.shadowRoot?.querySelector("select") as HTMLSelectElement;
    select.value = "vic";
    select.dispatchEvent(new Event("change", { bubbles: true }));

    expect(events[0].detail).toEqual({ value: "vic" });
  });
});
