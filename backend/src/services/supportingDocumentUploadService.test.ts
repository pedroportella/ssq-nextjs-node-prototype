import { describe, expect, it } from "vitest";

import { SupportingDocumentUploadService } from "./supportingDocumentUploadService.js";

import type { PrototypeRepository } from "../repositories/prototypeRepository.js";

function createRepository(options: {
  draftOwner?: boolean;
  requestOwner?: boolean;
} = {}): PrototypeRepository {
  return {
    async getServiceRequestDraftForCustomer() {
      return options.draftOwner === false
        ? undefined
        : {
            id: "70000000-0000-4000-8000-000000000001",
            customerId: "10000000-0000-4000-8000-000000000001",
            transactionDefinitionId: "20000000-0000-4000-8000-000000000002",
            currentStep: "documents",
            payload: {},
            createdAt: "2026-06-10T00:00:00.000Z",
            updatedAt: "2026-06-10T00:00:00.000Z"
          };
    },
    async getServiceRequestByReferenceForCustomer() {
      return options.requestOwner
        ? {
            id: "30000000-0000-4000-8000-000000000001",
            customerId: "10000000-0000-4000-8000-000000000001",
            transactionDefinitionId: "20000000-0000-4000-8000-000000000002",
            referenceNumber: "SSQ-DEMO-0001",
            status: "SUBMITTED",
            payload: {}
          }
        : undefined;
    },
    async createSupportingDocument(input: {
      customerId: string;
      serviceRequestDraftId?: string;
      serviceRequestId?: string;
      category: string;
      fileName: string;
      fileExtension: string;
      mimeType: string;
      sizeBytes: number;
      storageKey: string;
      uploadStatus: string;
      scanStatus: string;
      retentionPolicy: string;
      metadata?: Record<string, unknown>;
    }) {
      return {
        id: "90000000-0000-4000-8000-000000000001",
        customerId: input.customerId,
        serviceRequestDraftId: input.serviceRequestDraftId,
        serviceRequestId: input.serviceRequestId,
        category: input.category,
        fileName: input.fileName,
        fileExtension: input.fileExtension,
        mimeType: input.mimeType,
        sizeBytes: input.sizeBytes,
        storageKey: input.storageKey,
        uploadStatus: input.uploadStatus,
        scanStatus: input.scanStatus,
        retentionPolicy: input.retentionPolicy,
        metadata: input.metadata ?? {},
        createdAt: "2026-06-10T00:00:00.000Z",
        updatedAt: "2026-06-10T00:00:00.000Z"
      };
    }
  } as unknown as PrototypeRepository;
}

describe("SupportingDocumentUploadService", () => {
  it("records an allowed document upload for a customer-owned draft", async () => {
    const service = new SupportingDocumentUploadService(createRepository());

    const result = await service.recordUpload({
      customerId: "10000000-0000-4000-8000-000000000001",
      upload: {
        target: {
          type: "DRAFT",
          draftId: "70000000-0000-4000-8000-000000000001"
        },
        category: "identity",
        fileName: "proof-of-age.pdf",
        mimeType: "application/pdf",
        sizeBytes: 2048
      }
    });

    expect(result).toMatchObject({
      ok: true,
      document: {
        category: "identity",
        fileExtension: ".pdf",
        uploadStatus: "METADATA_RECORDED",
        scanStatus: "NOT_SCANNED_PROTOTYPE",
        retentionPolicy: "PRODUCTION_NEXT_REQUIRED",
        metadata: {
          localStorageMode: "metadata-only",
          productionNext: {
            malwareScanning: "required",
            privateStorage: "required"
          }
        }
      }
    });
  });

  it("rejects unsupported MIME types and extensions", async () => {
    const service = new SupportingDocumentUploadService(createRepository());

    await expect(service.recordUpload({
      customerId: "10000000-0000-4000-8000-000000000001",
      upload: {
        target: {
          type: "DRAFT",
          draftId: "70000000-0000-4000-8000-000000000001"
        },
        category: "identity",
        fileName: "script.exe",
        mimeType: "application/pdf",
        sizeBytes: 2048
      }
    })).resolves.toMatchObject({
      ok: false,
      code: "UNSUPPORTED_FILE_TYPE",
      fieldErrors: [
        {
          field: "fileName"
        }
      ]
    });

    await expect(service.recordUpload({
      customerId: "10000000-0000-4000-8000-000000000001",
      upload: {
        target: {
          type: "DRAFT",
          draftId: "70000000-0000-4000-8000-000000000001"
        },
        category: "identity",
        fileName: "proof.pdf",
        mimeType: "text/plain" as "application/pdf",
        sizeBytes: 2048
      }
    })).resolves.toMatchObject({
      ok: false,
      code: "INVALID_UPLOAD"
    });
  });

  it("rejects over-limit files", async () => {
    const service = new SupportingDocumentUploadService(createRepository());

    await expect(service.recordUpload({
      customerId: "10000000-0000-4000-8000-000000000001",
      upload: {
        target: {
          type: "DRAFT",
          draftId: "70000000-0000-4000-8000-000000000001"
        },
        category: "income",
        fileName: "income.pdf",
        mimeType: "application/pdf",
        sizeBytes: 5 * 1024 * 1024 + 1
      }
    })).resolves.toMatchObject({
      ok: false,
      code: "FILE_TOO_LARGE"
    });
  });

  it("cannot attach to another customer's draft or request", async () => {
    const service = new SupportingDocumentUploadService(createRepository({
      draftOwner: false,
      requestOwner: false
    }));

    await expect(service.recordUpload({
      customerId: "10000000-0000-4000-8000-000000000999",
      upload: {
        target: {
          type: "DRAFT",
          draftId: "70000000-0000-4000-8000-000000000001"
        },
        category: "identity",
        fileName: "proof.pdf",
        mimeType: "application/pdf",
        sizeBytes: 2048
      }
    })).resolves.toMatchObject({
      ok: false,
      code: "TARGET_NOT_FOUND"
    });

    await expect(service.recordUpload({
      customerId: "10000000-0000-4000-8000-000000000999",
      upload: {
        target: {
          type: "SERVICE_REQUEST",
          referenceNumber: "SSQ-DEMO-0001"
        },
        category: "identity",
        fileName: "proof.pdf",
        mimeType: "application/pdf",
        sizeBytes: 2048
      }
    })).resolves.toMatchObject({
      ok: false,
      code: "TARGET_NOT_FOUND"
    });
  });
});
