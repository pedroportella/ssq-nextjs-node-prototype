import { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";

import { SsqWebRadioGroup } from "./SsqWebRadioGroup";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe("SsqWebRadioGroup", () => {
  it("bridges ssq-change custom event details to React callbacks", async () => {
    const container = document.createElement("div");
    const root = createRoot(container);
    const onSsqChange = vi.fn();
    const options = [
      { label: "Email", value: "email" },
      { label: "Phone", value: "phone" }
    ];

    await act(async () => {
      root.render(<SsqWebRadioGroup label="Contact method" onSsqChange={onSsqChange} options={options} value="email" />);
    });

    const element = container.querySelector("ssq-radio-group");

    expect(element).toBeInstanceOf(customElements.get("ssq-radio-group"));
    expect(element?.options).toBe(options);

    element?.dispatchEvent(
      new CustomEvent("ssq-change", {
        bubbles: true,
        composed: true,
        detail: { value: "phone" }
      })
    );

    expect(onSsqChange).toHaveBeenCalledTimes(1);
    expect(onSsqChange.mock.calls[0][0].detail).toEqual({ value: "phone" });

    await act(async () => {
      root.unmount();
    });
  });
});
