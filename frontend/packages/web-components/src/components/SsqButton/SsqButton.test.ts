import { describe, expect, it } from "vitest";

import { fixture } from "../../internal/testHelpers";
import "./SsqButton";

describe("ssq-button", () => {
  it("renders QGDS-compatible button classes", async () => {
    const element = await fixture(document.createElement("ssq-button"));
    element.variant = "secondary";
    element.textContent = "Continue";
    await element.updateComplete;

    const button = element.shadowRoot?.querySelector("button");

    expect(button?.tagName).toBe("BUTTON");
    expect(button?.classList.contains("qld__btn")).toBe(true);
    expect(button?.classList.contains("qld__btn--secondary")).toBe(true);
    expect(button?.getAttribute("type")).toBe("button");
    expect(button?.classList.contains("ssq-button--secondary")).toBe(true);
  });

  it("emits a composed custom event with detail", async () => {
    const element = await fixture(document.createElement("ssq-button"));
    const events: CustomEvent[] = [];
    element.addEventListener("ssq-click", (event) => events.push(event as CustomEvent));

    element.shadowRoot?.querySelector("button")?.click();

    expect(events).toHaveLength(1);
    expect(events[0].bubbles).toBe(true);
    expect(events[0].composed).toBe(true);
    expect(events[0].detail).toEqual({ href: undefined, variant: "primary" });
  });

  it("renders disabled links without an href", async () => {
    const element = await fixture(document.createElement("ssq-button"));
    element.href = "/apply";
    element.disabled = true;
    await element.updateComplete;

    const anchor = element.shadowRoot?.querySelector("a");

    expect(anchor?.getAttribute("aria-disabled")).toBe("true");
    expect(anchor?.hasAttribute("href")).toBe(false);
    expect(anchor?.getAttribute("role")).toBe("button");
    expect(anchor?.getAttribute("tabindex")).toBe("-1");
  });
});
