import { describe, expect, it } from "vitest";

import { GET } from "../app/service-requests/[referenceNumber]/supporting-documents/[documentId]/download/route";

describe("seniors card supporting document download route", () => {
  it("streams the mock document artefact with filename disposition", async () => {
    const response = await GET(
      new Request("http://localhost/service-requests/SC-2026-0001/supporting-documents/mock-sc-identity-evidence/download"),
      {
        params: Promise.resolve({
          documentId: "mock-sc-identity-evidence",
          referenceNumber: "SC-2026-0001"
        })
      }
    );

    expect(response.headers.get("content-type")).toBe("text/plain; charset=utf-8");
    expect(response.headers.get("content-disposition")).toBe('attachment; filename="identity-evidence.pdf.prototype.txt"');
    await expect(response.text()).resolves.toContain("Document ID: mock-sc-identity-evidence");
  });
});
