import { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";

import { SsqWebTextInput } from "./SsqWebTextInput";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe("SsqWebTextInput", () => {
  it("bridges ssq-input and ssq-change custom event details to React callbacks", async () => {
    const container = document.createElement("div");
    const root = createRoot(container);
    const onSsqChange = vi.fn();
    const onSsqInput = vi.fn();

    await act(async () => {
      root.render(
        <SsqWebTextInput
          id="full-name"
          label="Full name"
          onSsqChange={onSsqChange}
          onSsqInput={onSsqInput}
          required
        />
      );
    });

    const element = container.querySelector("ssq-text-input");

    expect(element).toBeInstanceOf(customElements.get("ssq-text-input"));
    expect(element?.label).toBe("Full name");
    expect(element?.required).toBe(true);

    element?.dispatchEvent(
      new CustomEvent("ssq-input", {
        bubbles: true,
        composed: true,
        detail: { value: "Ada" }
      })
    );
    element?.dispatchEvent(
      new CustomEvent("ssq-change", {
        bubbles: true,
        composed: true,
        detail: { value: "Ada Lovelace" }
      })
    );

    expect(onSsqInput).toHaveBeenCalledTimes(1);
    expect(onSsqInput.mock.calls[0][0].detail).toEqual({ value: "Ada" });
    expect(onSsqChange).toHaveBeenCalledTimes(1);
    expect(onSsqChange.mock.calls[0][0].detail).toEqual({ value: "Ada Lovelace" });

    await act(async () => {
      root.unmount();
    });
  });
});
