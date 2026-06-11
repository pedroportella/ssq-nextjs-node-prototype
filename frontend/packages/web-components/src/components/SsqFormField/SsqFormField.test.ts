import { describe, expect, it } from "vitest";

import { fixture } from "../../internal/testHelpers";
import "./SsqFormField";

describe("ssq-form-field", () => {
  it("renders label, hint, error and requirement text", async () => {
    const element = await fixture(document.createElement("ssq-form-field"));
    element.controlId = "customer-name";
    element.label = "Customer name";
    element.hint = "Use your legal name";
    element.error = "Enter a name";
    element.required = true;
    await element.updateComplete;

    const label = element.shadowRoot?.querySelector("label");
    const hint = element.shadowRoot?.querySelector("#customer-name-hint");
    const error = element.shadowRoot?.querySelector("#customer-name-error");

    expect(label?.getAttribute("for")).toBe("customer-name");
    expect(label?.textContent).toContain("Customer name");
    expect(label?.textContent).toContain("required");
    expect(hint?.textContent).toBe("Use your legal name");
    expect(error?.textContent).toBe("Enter a name");
  });
});
