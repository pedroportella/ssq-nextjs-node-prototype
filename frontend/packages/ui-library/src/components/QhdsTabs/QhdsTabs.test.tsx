import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";

import { QhdsTabs } from "./QhdsTabs";

let root: Root | undefined;
let container: HTMLDivElement | undefined;

function renderTabs() {
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);

  act(() => {
    root?.render(
      <QhdsTabs
        items={[
          { id: "summary", label: "Summary", panel: <p>Summary panel</p> },
          { id: "history", label: "History", panel: <p>History panel</p> }
        ]}
        label="Application details"
      />
    );
  });

  return container;
}

afterEach(() => {
  act(() => {
    root?.unmount();
  });
  container?.remove();
  root = undefined;
  container = undefined;
});

describe("QhdsTabs", () => {
  it("renders tab ARIA relationships and switches panels", () => {
    const element = renderTabs();
    const summaryTab = element.querySelector<HTMLButtonElement>("#summary-tab");
    const historyTab = element.querySelector<HTMLButtonElement>("#history-tab");
    const summaryPanel = element.querySelector<HTMLElement>("#summary-tabpanel");
    const historyPanel = element.querySelector<HTMLElement>("#history-tabpanel");

    expect(element.querySelector(".qld__tab-container")).not.toBeNull();
    expect(element.querySelector(".qld__tabs")).not.toBeNull();
    expect(summaryTab?.className).toContain("qld__tab-button");
    expect(summaryPanel?.className).toContain("qld__tab-panel");
    expect(summaryTab?.getAttribute("aria-selected")).toBe("true");
    expect(summaryPanel?.hidden).toBe(false);
    expect(historyPanel?.hidden).toBe(true);

    act(() => {
      historyTab?.click();
    });

    expect(summaryTab?.getAttribute("aria-selected")).toBe("false");
    expect(historyTab?.getAttribute("aria-selected")).toBe("true");
    expect(summaryPanel?.hidden).toBe(true);
    expect(historyPanel?.hidden).toBe(false);
  });

  it("moves selection with arrow keys", () => {
    const element = renderTabs();
    const summaryTab = element.querySelector<HTMLButtonElement>("#summary-tab");
    const historyTab = element.querySelector<HTMLButtonElement>("#history-tab");

    act(() => {
      summaryTab?.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowRight" }));
    });

    expect(historyTab?.getAttribute("aria-selected")).toBe("true");
    expect(document.activeElement).toBe(historyTab);
  });
});
