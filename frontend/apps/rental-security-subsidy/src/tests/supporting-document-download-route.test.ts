import { describe, expect, it } from "vitest";

import { GET } from "../app/service-requests/[referenceNumber]/supporting-documents/[documentId]/download/route";

describe("rental subsidy supporting document download route", () => {
  it("streams the mock document artifact with filename disposition", async () => {
    const response = await GET(
      new Request("http://localhost/service-requests/RSS-2026-0001/supporting-documents/mock-rss-rental-evidence/download"),
      {
        params: Promise.resolve({
          documentId: "mock-rss-rental-evidence",
          referenceNumber: "RSS-2026-0001"
        })
      }
    );

    expect(response.headers.get("content-type")).toBe("text/plain; charset=utf-8");
    expect(response.headers.get("content-disposition")).toBe('attachment; filename="rental-property-evidence.pdf.prototype.txt"');
    await expect(response.text()).resolves.toContain("Document ID: mock-rss-rental-evidence");
  });
});
