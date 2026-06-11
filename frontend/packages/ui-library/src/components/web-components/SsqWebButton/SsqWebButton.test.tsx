import { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";

import { SsqWebButton } from "./SsqWebButton";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe("SsqWebButton", () => {
  it("bridges ssq-click custom event details to React callbacks", async () => {
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    const onSsqClick = vi.fn();

    await act(async () => {
      root.render(
        <SsqWebButton href="/apply" onSsqClick={onSsqClick} variant="secondary">
          Apply
        </SsqWebButton>
      );
    });

    const element = container.querySelector("ssq-button");

    expect(element).toBeInstanceOf(customElements.get("ssq-button"));
    expect(element?.href).toBe("/apply");
    expect(element?.variant).toBe("secondary");

    element?.dispatchEvent(
      new CustomEvent("ssq-click", {
        bubbles: true,
        composed: true,
        detail: { href: "/apply", variant: "secondary" }
      })
    );

    expect(onSsqClick).toHaveBeenCalledTimes(1);
    expect(onSsqClick.mock.calls[0][0].detail).toEqual({ href: "/apply", variant: "secondary" });

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });
});
