import { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it } from "vitest";

import { SsqWebFormField } from "./SsqWebFormField";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe("SsqWebFormField", () => {
  it("wraps the ssq-form-field custom element", async () => {
    const container = document.createElement("div");
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <SsqWebFormField controlId="full-name" error="Enter a name" label="Full name">
          <input id="full-name" />
        </SsqWebFormField>
      );
    });

    const element = container.querySelector("ssq-form-field");

    expect(element).toBeInstanceOf(customElements.get("ssq-form-field"));
    expect(element?.controlId).toBe("full-name");
    expect(element?.error).toBe("Enter a name");

    await act(async () => {
      root.unmount();
    });
  });
});
