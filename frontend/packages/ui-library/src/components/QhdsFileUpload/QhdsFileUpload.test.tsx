import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { QhdsFileUpload } from "./QhdsFileUpload";

describe("QhdsFileUpload", () => {
  it("renders upload policy and uploaded/rejected states", () => {
    const html = renderToStaticMarkup(
      <QhdsFileUpload
        label="Upload supporting documents"
        name="documents"
        policy={{
          acceptedFileTypes: ["application/pdf", "image/png"],
          maxFileSizeBytes: 10 * 1024 * 1024
        }}
        uploadedFiles={[
          {
            category: "Evidence",
            fileName: "identity.pdf",
            sizeBytes: 512_000,
            status: "uploaded"
          },
          {
            fileName: "archive.zip",
            message: "Upload a PDF or PNG file.",
            sizeBytes: 14_000_000,
            status: "rejected"
          }
        ]}
      />
    );

    expect(html).toContain('type="file"');
    expect(html).toContain('accept="application/pdf,image/png"');
    expect(html).toContain("Maximum file size: 10.0 MB");
    expect(html).toContain("identity.pdf");
    expect(html).toContain("archive.zip");
    expect(html).toContain("Rejected");
  });
});
