import { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it } from "vitest";

import { SsqWebAlert } from "./SsqWebAlert";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe("SsqWebAlert", () => {
  it("wraps the ssq-alert custom element", async () => {
    const container = document.createElement("div");
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <SsqWebAlert heading="Saved" tone="success">
          Application saved.
        </SsqWebAlert>
      );
    });

    const element = container.querySelector("ssq-alert");

    expect(element).toBeInstanceOf(customElements.get("ssq-alert"));
    expect(element?.heading).toBe("Saved");
    expect(element?.tone).toBe("success");

    await act(async () => {
      root.unmount();
    });
  });
});
