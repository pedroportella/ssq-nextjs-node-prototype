import { describe, expect, it } from "vitest";

import { GET } from "../app/service-requests/[referenceNumber]/summary/download/route";

describe("rental subsidy submission summary download route", () => {
  it("streams the mock summary with filename disposition", async () => {
    const response = await GET(new Request("http://localhost/service-requests/RSS-2026-0001/summary/download"), {
      params: Promise.resolve({ referenceNumber: "RSS-2026-0001" })
    });

    expect(response.headers.get("content-type")).toBe("text/plain; charset=utf-8");
    expect(response.headers.get("content-disposition")).toBe('attachment; filename="rss-2026-0001-summary.txt"');
    await expect(response.text()).resolves.toContain("Reference: RSS-2026-0001");
  });
});
