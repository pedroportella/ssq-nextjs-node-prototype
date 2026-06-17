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
            downloadHref: "/service-requests/SC-2026-0001/supporting-documents/mock-sc-identity-evidence/download",
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
    expect(html).toContain("qld__form-group");
    expect(html).toContain("qld__label");
    expect(html).toContain("qld__hint-text");
    expect(html).toContain("qld__form-file-wrapper");
    expect(html).toContain("qld__form-file-dropzone");
    expect(html).toContain("qld__file-input");
    expect(html).toContain("qld__form-file-preview");
    expect(html).toContain("qld__form-file--success");
    expect(html).toContain("qld__form-file--error");
    expect(html).toContain("Maximum file size: 10.0 MB");
    expect(html).toContain("identity.pdf");
    expect(html).toContain('href="/service-requests/SC-2026-0001/supporting-documents/mock-sc-identity-evidence/download"');
    expect(html).toContain("archive.zip");
    expect(html).toContain("Rejected");
  });

  it("renders accessible errors and accepts change handlers", () => {
    const onChange = vi.fn();
    const html = renderToStaticMarkup(
      <QhdsFileUpload
        error="Choose a smaller file."
        hint="Upload documents that support this request."
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
    expect(html).toContain('aria-describedby="supporting-documents-custom-hint supporting-documents-hint supporting-documents-error"');
    expect(html).toContain('id="supporting-documents-custom-hint"');
    expect(html).toContain("qld__input--error");
    expect(html).toContain("Choose a smaller file.");
    expect(html).toContain("multiple");
  });
});
