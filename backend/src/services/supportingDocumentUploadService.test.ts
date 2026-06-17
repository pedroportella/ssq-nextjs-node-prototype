import { describe, expect, it } from "vitest";

import { SupportingDocumentUploadService } from "./supportingDocumentUploadService.js";

import type { PrototypeRepository } from "../repositories/prototypeRepository.js";

function createRepository(options: {
  draftOwner?: boolean;
  existingDocuments?: Array<{
    metadata?: Record<string, unknown>;
    scanStatus?: string;
    sizeBytes: number;
    uploadStatus?: string;
  }>;
  requestOwner?: boolean;
  transactionKey?: string;
} = {}): PrototypeRepository {
  const transactionKey = options.transactionKey ?? "seniors-card";

  return {
    async getServiceRequestDraftForCustomer() {
      return options.draftOwner === false
        ? undefined
        : {
            id: "70000000-0000-4000-8000-000000000001",
            customerId: "10000000-0000-4000-8000-000000000001",
            transactionDefinitionId: "20000000-0000-4000-8000-000000000002",
            transactionKey,
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
            payload: {},
            transactionKey
          }
        : undefined;
    },
    async listSupportingDocumentsForCustomer() {
      return (options.existingDocuments ?? []).map((document, index) => ({
        id: `90000000-0000-4000-8000-00000000000${index}`,
        customerId: "10000000-0000-4000-8000-000000000001",
        serviceRequestDraftId: "70000000-0000-4000-8000-000000000001",
        category: "identity",
        fileName: `existing-${index}.pdf`,
        fileExtension: ".pdf",
        mimeType: "application/pdf",
        sizeBytes: document.sizeBytes,
        storageKey: `local-review/existing-${index}.pdf`,
        uploadStatus: document.uploadStatus ?? "STORED_PROTOTYPE",
        scanStatus: document.scanStatus ?? "AVAILABLE",
        retentionPolicy: "PROTOTYPE_REVIEW_90_DAYS",
        metadata: document.metadata ?? {},
        createdAt: "2026-06-10T00:00:00.000Z",
        updatedAt: "2026-06-10T00:00:00.000Z"
      }));
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
        uploadStatus: "STORED_PROTOTYPE",
        scanStatus: "AVAILABLE",
        retentionPolicy: "PROTOTYPE_REVIEW_90_DAYS",
        metadata: {
          personKey: "applicant",
          policy: {
            allowedCategories: ["identity", "residency", "concession", "supporting-evidence"],
            allowedPersonKeys: ["applicant"],
            maxFilesPerPerson: 5,
            maxSizeBytes: 5242880,
            maxTotalSizeBytesPerPerson: 10485760,
            transactionKey: "seniors-card"
          },
          localStorageMode: "prototype-evidence-storage-adapter",
          productionNext: {
            malwareScanning: "replace deterministic prototype scan",
            privateObjectStorage: "replace metadata-backed local adapter",
            retentionSchedule: "replace prototype review retention class"
          },
          retention: {
            policy: "PROTOTYPE_REVIEW_90_DAYS",
            reviewDisposition: "delete-after-local-review"
          },
          scan: {
            engine: "prototype-deterministic-scan",
            status: "AVAILABLE"
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
        fileName: "photo.jpg",
        mimeType: "application/pdf",
        sizeBytes: 2048
      }
    })).resolves.toMatchObject({
      ok: false,
      code: "UNSUPPORTED_FILE_TYPE",
      fieldErrors: [
        {
          field: "mimeType"
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
      code: "UNSUPPORTED_FILE_TYPE",
      fieldErrors: [
        {
          field: "mimeType"
        }
      ]
    });
  });

  it("applies transaction-specific category and person-key policy", async () => {
    const seniorsCardService = new SupportingDocumentUploadService(createRepository({
      transactionKey: "seniors-card"
    }));

    await expect(seniorsCardService.recordUpload({
      customerId: "10000000-0000-4000-8000-000000000001",
      upload: {
        target: {
          type: "DRAFT",
          draftId: "70000000-0000-4000-8000-000000000001"
        },
        category: "income",
        fileName: "income.pdf",
        mimeType: "application/pdf",
        sizeBytes: 2048
      }
    })).resolves.toMatchObject({
      ok: false,
      code: "UNSUPPORTED_CATEGORY",
      fieldErrors: [
        {
          field: "category",
          message: "Allowed categories: identity, residency, concession, supporting-evidence."
        }
      ],
      policy: {
        allowedCategories: ["identity", "residency", "concession", "supporting-evidence"],
        allowedPersonKeys: ["applicant"]
      }
    });

    const rentalSecuritySubsidyService = new SupportingDocumentUploadService(createRepository({
      transactionKey: "rental-security-subsidy"
    }));

    await expect(rentalSecuritySubsidyService.recordUpload({
      customerId: "10000000-0000-4000-8000-000000000001",
      upload: {
        target: {
          type: "DRAFT",
          draftId: "70000000-0000-4000-8000-000000000001"
        },
        category: "income",
        fileName: "household-income.pdf",
        mimeType: "application/pdf",
        personKey: "household-member",
        sizeBytes: 2048
      }
    })).resolves.toMatchObject({
      ok: true,
      document: {
        category: "income",
        metadata: {
          personKey: "household-member",
          policy: {
            allowedCategories: ["identity", "residency", "income", "supporting-evidence"],
            allowedPersonKeys: ["applicant", "household-member"],
            transactionKey: "rental-security-subsidy"
          }
        }
      },
      policy: {
        allowedCategories: ["identity", "residency", "income", "supporting-evidence"],
        allowedPersonKeys: ["applicant", "household-member"]
      }
    });

    await expect(rentalSecuritySubsidyService.recordUpload({
      customerId: "10000000-0000-4000-8000-000000000001",
      upload: {
        target: {
          type: "DRAFT",
          draftId: "70000000-0000-4000-8000-000000000001"
        },
        category: "concession",
        fileName: "concession.pdf",
        mimeType: "application/pdf",
        sizeBytes: 2048
      }
    })).resolves.toMatchObject({
      ok: false,
      code: "UNSUPPORTED_CATEGORY",
      fieldErrors: [
        {
          field: "category",
          message: "Allowed categories: identity, residency, income, supporting-evidence."
        }
      ]
    });

    await expect(rentalSecuritySubsidyService.recordUpload({
      customerId: "10000000-0000-4000-8000-000000000001",
      upload: {
        target: {
          type: "DRAFT",
          draftId: "70000000-0000-4000-8000-000000000001"
        },
        category: "income",
        fileName: "household-income.pdf",
        mimeType: "application/pdf",
        personKey: "partner",
        sizeBytes: 2048
      }
    })).resolves.toMatchObject({
      ok: false,
      code: "UNSUPPORTED_PERSON_KEY",
      fieldErrors: [
        {
          field: "personKey",
          message: "Allowed person keys: applicant, household-member."
        }
      ]
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
        category: "identity",
        fileName: "income.pdf",
        mimeType: "application/pdf",
        sizeBytes: 5 * 1024 * 1024 + 1
      }
    })).resolves.toMatchObject({
      ok: false,
      code: "FILE_TOO_LARGE"
    });
  });

  it("enforces per-person count and total size limits", async () => {
    const countLimitedService = new SupportingDocumentUploadService(createRepository({
      existingDocuments: Array.from({ length: 5 }, () => ({
        metadata: {
          personKey: "applicant"
        },
        sizeBytes: 1024
      }))
    }));

    await expect(countLimitedService.recordUpload({
      customerId: "10000000-0000-4000-8000-000000000001",
      upload: {
        target: {
          type: "DRAFT",
          draftId: "70000000-0000-4000-8000-000000000001"
        },
        category: "identity",
        fileName: "applicant-extra.pdf",
        mimeType: "application/pdf",
        sizeBytes: 1024
      }
    })).resolves.toMatchObject({
      ok: false,
      code: "PERSON_LIMIT_EXCEEDED",
      fieldErrors: [
        {
          field: "personKey"
        }
      ]
    });

    const sizeLimitedService = new SupportingDocumentUploadService(createRepository({
      existingDocuments: [
        {
          metadata: {
            personKey: "applicant"
          },
          sizeBytes: 9 * 1024 * 1024
        }
      ]
    }));

    await expect(sizeLimitedService.recordUpload({
      customerId: "10000000-0000-4000-8000-000000000001",
      upload: {
        target: {
          type: "DRAFT",
          draftId: "70000000-0000-4000-8000-000000000001"
        },
        category: "identity",
        fileName: "large-top-up.pdf",
        mimeType: "application/pdf",
        sizeBytes: 2 * 1024 * 1024
      }
    })).resolves.toMatchObject({
      ok: false,
      code: "PERSON_LIMIT_EXCEEDED",
      fieldErrors: [
        {
          field: "sizeBytes"
        }
      ]
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
