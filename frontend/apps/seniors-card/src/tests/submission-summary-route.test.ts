import { describe, expect, it } from "vitest";

import { GET } from "../app/service-requests/[referenceNumber]/summary/download/route";

describe("seniors card submission summary download route", () => {
  it("streams the mock summary with filename disposition", async () => {
    const response = await GET(new Request("http://localhost/service-requests/SC-2026-0001/summary/download"), {
      params: Promise.resolve({ referenceNumber: "SC-2026-0001" })
    });

    expect(response.headers.get("content-type")).toBe("text/plain; charset=utf-8");
    expect(response.headers.get("content-disposition")).toBe('attachment; filename="sc-2026-0001-summary.txt"');
    await expect(response.text()).resolves.toContain("Reference: SC-2026-0001");
  });
});
