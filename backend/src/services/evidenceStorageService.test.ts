import { describe, expect, it } from "vitest";

import { EvidenceStorageService, isDocumentAvailable } from "./evidenceStorageService.js";

import type { SupportingDocumentRecord } from "../repositories/prototypeRepository.js";

function createDocument(overrides: Partial<SupportingDocumentRecord> = {}): SupportingDocumentRecord {
  return {
    id: "90000000-0000-4000-8000-000000000001",
    customerId: "10000000-0000-4000-8000-000000000001",
    serviceRequestId: "30000000-0000-4000-8000-000000000001",
    category: "identity",
    fileName: "identity-evidence.pdf",
    fileExtension: ".pdf",
    mimeType: "application/pdf",
    sizeBytes: 512000,
    storageKey: "prototype-evidence/10000000-0000-4000-8000-000000000001/document.pdf",
    uploadStatus: "STORED_PROTOTYPE",
    scanStatus: "AVAILABLE",
    retentionPolicy: "PROTOTYPE_REVIEW_90_DAYS",
    metadata: {
      personKey: "applicant"
    },
    createdAt: "2026-06-10T00:00:00.000Z",
    updatedAt: "2026-06-10T00:00:00.000Z",
    ...overrides
  };
}

describe("EvidenceStorageService", () => {
  it("creates production-shaped prototype evidence metadata", () => {
    const service = new EvidenceStorageService();

    const result = service.createStoredPrototypeEvidence({
      category: "identity",
      correlationId: "upload-correlation",
      customerId: "10000000-0000-4000-8000-000000000001",
      fileExtension: ".pdf",
      fileName: "identity-evidence.pdf",
      mimeType: "application/pdf",
      personKey: "applicant",
      sizeBytes: 512000,
      transactionKey: "seniors-card"
    });

    expect(result).toMatchObject({
      uploadStatus: "STORED_PROTOTYPE",
      scanStatus: "AVAILABLE",
      retentionPolicy: "PROTOTYPE_REVIEW_90_DAYS",
      metadata: {
        correlationId: "upload-correlation",
        localStorageMode: "prototype-evidence-storage-adapter",
        personKey: "applicant",
        retention: {
          policy: "PROTOTYPE_REVIEW_90_DAYS"
        },
        scan: {
          engine: "prototype-deterministic-scan",
          status: "AVAILABLE"
        },
        transactionKey: "seniors-card"
      }
    });
    expect(result.storageKey).toMatch(/^prototype-evidence\/10000000-0000-4000-8000-000000000001\/.+\.pdf$/);
  });

  it("uses deterministic scan states for local review scenarios", () => {
    const service = new EvidenceStorageService();
    const createScanStatus = (fileName: string) => service.createStoredPrototypeEvidence({
      category: "identity",
      customerId: "10000000-0000-4000-8000-000000000001",
      fileExtension: ".pdf",
      fileName,
      mimeType: "application/pdf",
      personKey: "applicant",
      sizeBytes: 512000,
      transactionKey: "seniors-card"
    }).scanStatus;

    expect(createScanStatus("identity-pending.pdf")).toBe("PENDING_SCAN");
    expect(createScanStatus("identity-quarantine.pdf")).toBe("QUARANTINED");
    expect(createScanStatus("identity-malware.pdf")).toBe("REJECTED");
    expect(createScanStatus("identity-reject.pdf")).toBe("REJECTED");
  });

  it("only creates downloads for available evidence", () => {
    const service = new EvidenceStorageService();

    expect(isDocumentAvailable(createDocument())).toBe(true);
    expect(isDocumentAvailable(createDocument({
      scanStatus: "PASSED"
    }))).toBe(true);
    expect(service.createDownload(createDocument())).toMatchObject({
      ok: true,
      download: {
        contentType: "text/plain; charset=utf-8",
        fileName: "identity-evidence.pdf.prototype.txt"
      }
    });
    expect(service.createDownload(createDocument({
      scanStatus: "PENDING_SCAN"
    }))).toMatchObject({
      ok: false,
      code: "DOCUMENT_NOT_AVAILABLE"
    });
    expect(service.createDownload(createDocument({
      scanStatus: "QUARANTINED"
    }))).toMatchObject({
      ok: false,
      code: "DOCUMENT_NOT_AVAILABLE"
    });
    expect(service.createDownload(createDocument({
      scanStatus: "REJECTED"
    }))).toMatchObject({
      ok: false,
      code: "DOCUMENT_NOT_AVAILABLE"
    });
  });
});
