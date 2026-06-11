import { describe, expect, it } from "vitest";

import { fixture } from "../../internal/testHelpers";
import "./SsqTextInput";

describe("ssq-text-input", () => {
  it("associates label, hint and error with the input", async () => {
    const element = await fixture(document.createElement("ssq-text-input"));
    element.id = "email";
    element.label = "Email";
    element.hint = "Use your preferred email";
    element.error = "Enter an email";
    await element.updateComplete;

    const input = element.shadowRoot?.querySelector("input");
    const label = element.shadowRoot?.querySelector("label");
    const hint = element.shadowRoot?.querySelector("#email-hint");
    const error = element.shadowRoot?.querySelector("#email-error");

    expect(label?.classList.contains("qld__label")).toBe(true);
    expect(label?.getAttribute("for")).toBe("email");
    expect(hint?.classList.contains("qld__hint-text")).toBe(true);
    expect(input?.classList.contains("qld__text-input")).toBe(true);
    expect(input?.getAttribute("id")).toBe("email");
    expect(input?.getAttribute("aria-invalid")).toBe("true");
    expect(input?.getAttribute("aria-describedby")).toBe("email-hint email-error");
    expect(error?.classList.contains("qld__input--error")).toBe(true);
  });

  it("emits input and change events with value detail", async () => {
    const element = await fixture(document.createElement("ssq-text-input"));
    const inputEvents: CustomEvent[] = [];
    const changeEvents: CustomEvent[] = [];
    element.addEventListener("ssq-input", (event) => inputEvents.push(event as CustomEvent));
    element.addEventListener("ssq-change", (event) => changeEvents.push(event as CustomEvent));

    const input = element.shadowRoot?.querySelector("input") as HTMLInputElement;
    input.value = "hello";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));

    expect(inputEvents[0].detail).toEqual({ value: "hello" });
    expect(changeEvents[0].detail).toEqual({ value: "hello" });
  });
});
