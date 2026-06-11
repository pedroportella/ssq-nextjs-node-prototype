import { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";

import { SsqWebCheckbox } from "./SsqWebCheckbox";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe("SsqWebCheckbox", () => {
  it("bridges ssq-change custom event details to React callbacks", async () => {
    const container = document.createElement("div");
    const root = createRoot(container);
    const onSsqChange = vi.fn();

    await act(async () => {
      root.render(<SsqWebCheckbox label="I confirm" onSsqChange={onSsqChange} required value="yes" />);
    });

    const element = container.querySelector("ssq-checkbox");

    expect(element).toBeInstanceOf(customElements.get("ssq-checkbox"));
    expect(element?.label).toBe("I confirm");
    expect(element?.required).toBe(true);

    element?.dispatchEvent(
      new CustomEvent("ssq-change", {
        bubbles: true,
        composed: true,
        detail: { checked: true, value: "yes" }
      })
    );

    expect(onSsqChange).toHaveBeenCalledTimes(1);
    expect(onSsqChange.mock.calls[0][0].detail).toEqual({ checked: true, value: "yes" });

    await act(async () => {
      root.unmount();
    });
  });
});
