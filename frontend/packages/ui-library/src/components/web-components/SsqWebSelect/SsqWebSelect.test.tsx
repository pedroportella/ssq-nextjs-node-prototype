import { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";

import { SsqWebSelect } from "./SsqWebSelect";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe("SsqWebSelect", () => {
  it("bridges ssq-change custom event details to React callbacks", async () => {
    const container = document.createElement("div");
    const root = createRoot(container);
    const onSsqChange = vi.fn();
    const options = [
      { label: "Queensland", value: "qld" },
      { label: "Victoria", value: "vic" }
    ];

    await act(async () => {
      root.render(<SsqWebSelect label="State" onSsqChange={onSsqChange} options={options} value="qld" />);
    });

    const element = container.querySelector("ssq-select");

    expect(element).toBeInstanceOf(customElements.get("ssq-select"));
    expect(element?.options).toBe(options);

    element?.dispatchEvent(
      new CustomEvent("ssq-change", {
        bubbles: true,
        composed: true,
        detail: { value: "vic" }
      })
    );

    expect(onSsqChange).toHaveBeenCalledTimes(1);
    expect(onSsqChange.mock.calls[0][0].detail).toEqual({ value: "vic" });

    await act(async () => {
      root.unmount();
    });
  });
});
