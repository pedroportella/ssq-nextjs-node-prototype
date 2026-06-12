import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

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

  it("renders accessible errors and accepts change handlers", () => {
    const onChange = vi.fn();
    const html = renderToStaticMarkup(
      <QhdsFileUpload
        error="Choose a smaller file."
        label="Upload supporting documents"
        multiple
        name="documents"
        onChange={onChange}
        policy={{
          acceptedFileTypes: ["application/pdf"],
          maxFileSizeBytes: 10 * 1024 * 1024
        }}
      />
    );

    expect(html).toContain('aria-invalid="true"');
    expect(html).toContain('aria-describedby="supporting-documents-hint supporting-documents-error"');
    expect(html).toContain("Choose a smaller file.");
    expect(html).toContain("multiple");
  });
});
