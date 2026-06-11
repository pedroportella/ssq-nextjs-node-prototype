import { describe, expect, it } from "vitest";

import { fixture } from "../../internal/testHelpers";
import "./SsqAlert";

describe("ssq-alert", () => {
  it("renders a region with tone and heading", async () => {
    const element = await fixture(document.createElement("ssq-alert"));
    element.heading = "Application saved";
    element.tone = "success";
    await element.updateComplete;

    const region = element.shadowRoot?.querySelector("section");
    const heading = element.shadowRoot?.querySelector("h2");

    expect(region?.getAttribute("role")).toBe("region");
    expect(region?.getAttribute("aria-label")).toBe("Success");
    expect(region?.classList.contains("qld__page-alerts")).toBe(true);
    expect(region?.classList.contains("ssq-page-alert--success")).toBe(true);
    expect(heading?.textContent).toBe("Application saved");
  });
});
