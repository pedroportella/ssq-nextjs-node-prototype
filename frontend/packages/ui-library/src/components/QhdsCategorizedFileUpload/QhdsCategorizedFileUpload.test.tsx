import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { QhdsCategorizedFileUpload } from "./QhdsCategorizedFileUpload";
import { validateCategorizedFileUpload } from "./validation";

import type { QhdsCategorizedFileUploadItem } from "./validation";

const people = [
  { key: "applicant", label: "Applicant" },
  { key: "partner", label: "Partner" }
];

const categories = [
  { label: "Identity", value: "identity" },
  { label: "Residency", value: "residency" },
  { label: "Income", value: "income" }
];

const policy = {
  acceptedFileTypes: ["application/pdf", "image/png"],
  maxFileSizeBytes: 2 * 1024 * 1024,
  maxFilesPerPerson: 2,
  maxTotalSizeBytesPerPerson: 3 * 1024 * 1024
};

let root: Root | undefined;
let container: HTMLDivElement | undefined;

function createFile({ name, size, type }: { name: string; size: number; type: string }) {
  return new File([new Uint8Array(size)], name, { type });
}

function renderUpload(onChange = vi.fn()) {
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);

  act(() => {
    root?.render(
      <QhdsCategorizedFileUpload
        categories={categories}
        hint="Upload evidence by person."
        id="evidence"
        label="Supporting evidence"
        name="evidence"
        onChange={onChange}
        people={people}
        policy={policy}
      />
    );
  });

  return { element: container, onChange };
}

function selectFiles(input: HTMLInputElement, files: File[]) {
  Object.defineProperty(input, "files", {
    configurable: true,
    value: files
  });

  input.dispatchEvent(new Event("change", { bubbles: true }));
}

beforeEach(() => {
  vi.stubGlobal("crypto", {
    randomUUID: vi.fn().mockReturnValueOnce("file-1").mockReturnValueOnce("file-2").mockReturnValue("file-x")
  });
});

afterEach(() => {
  act(() => {
    root?.unmount();
  });
  container?.remove();
  root = undefined;
  container = undefined;
  vi.unstubAllGlobals();
});

describe("validateCategorizedFileUpload", () => {
  it("requires categories and checks per-file type and size", () => {
    const files: QhdsCategorizedFileUploadItem[] = [
      {
        category: "",
        fileName: "identity.pdf",
        id: "identity",
        mimeType: "application/pdf",
        personKey: "applicant",
        sizeBytes: 1000,
        status: "staged"
      },
      {
        category: "identity",
        fileName: "large.pdf",
        id: "large",
        mimeType: "application/pdf",
        personKey: "applicant",
        sizeBytes: 4 * 1024 * 1024,
        status: "staged"
      },
      {
        category: "identity",
        fileName: "archive.zip",
        id: "zip",
        mimeType: "application/zip",
        personKey: "applicant",
        sizeBytes: 1000,
        status: "staged"
      }
    ];

    const result = validateCategorizedFileUpload({ categories, files, people, policy });

    expect(result.isValid).toBe(false);
    expect(result.fileErrors.identity).toContain("Choose a category for identity.pdf.");
    expect(result.fileErrors.large.join(" ")).toContain("large.pdf must be 2.0 MB or smaller.");
    expect(result.fileErrors.zip).toContain("archive.zip is not an accepted file type.");
  });

  it("checks max files, total size and duplicate names per person", () => {
    const files: QhdsCategorizedFileUploadItem[] = [
      {
        category: "identity",
        fileName: "same.pdf",
        id: "file-a",
        mimeType: "application/pdf",
        personKey: "partner",
        sizeBytes: 1024 * 1024,
        status: "staged"
      },
      {
        category: "identity",
        fileName: "same.pdf",
        id: "file-b",
        mimeType: "application/pdf",
        personKey: "partner",
        sizeBytes: 1024 * 1024,
        status: "staged"
      },
      {
        category: "income",
        fileName: "income.pdf",
        id: "file-c",
        mimeType: "application/pdf",
        personKey: "partner",
        sizeBytes: 2 * 1024 * 1024,
        status: "staged"
      }
    ];

    const result = validateCategorizedFileUpload({ categories, files, people, policy });

    expect(result.isValid).toBe(false);
    expect(result.personErrors.partner).toContain("Partner can have a maximum of 2 files.");
    expect(result.personErrors.partner).toContain("Partner files must total 3.0 MB or less.");
    expect(result.fileErrors["file-a"]).toContain("Remove duplicate file name same.pdf from Partner.");
    expect(result.fileErrors["file-b"]).toContain("Remove duplicate file name same.pdf from Partner.");
  });
});

describe("QhdsCategorizedFileUpload", () => {
  it("stages files by person, updates categories and removes files", () => {
    const { element, onChange } = renderUpload();
    const input = element.querySelector<HTMLInputElement>("#evidence-applicant-upload");

    expect(input).not.toBeNull();

    act(() => {
      selectFiles(input as HTMLInputElement, [createFile({ name: "identity.pdf", size: 1024, type: "application/pdf" })]);
    });

    expect(element.textContent).toContain("identity.pdf");
    expect(element.textContent).toContain("Choose a category for identity.pdf.");
    expect(onChange).toHaveBeenCalledWith([
      expect.objectContaining({
        fileName: "identity.pdf",
        id: "file-1",
        personKey: "applicant",
        status: "staged"
      })
    ]);

    const category = element.querySelector<HTMLSelectElement>("#file-1-category");
    expect(category).not.toBeNull();

    act(() => {
      const categorySelect = category as HTMLSelectElement;
      categorySelect.value = "identity";
      categorySelect.dispatchEvent(new Event("change", { bubbles: true }));
    });

    expect(element.textContent).not.toContain("Choose a category for identity.pdf.");
    expect(onChange).toHaveBeenLastCalledWith([
      expect.objectContaining({
        category: "identity",
        fileName: "identity.pdf",
        personKey: "applicant"
      })
    ]);

    const remove = element.querySelector<HTMLButtonElement>(".ssq-categorized-upload__remove");
    expect(remove).not.toBeNull();

    act(() => {
      remove?.click();
    });

    expect(element.textContent).not.toContain("identity.pdf");
    expect(onChange).toHaveBeenLastCalledWith([]);
  });
});
