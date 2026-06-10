import { describe, expect, it } from "vitest";

import { SubmissionLifecycleService } from "./submissionLifecycleService.js";

import type {
  PrototypeRepository,
  ServiceRequestDraftRecord,
  ServiceRequestRecord,
  TransactionCatalogueRecord
} from "../repositories/prototypeRepository.js";
import type { TransactionCatalogueService } from "./transactionCatalogueService.js";

function createDraft(overrides: Partial<ServiceRequestDraftRecord> = {}): ServiceRequestDraftRecord {
  return {
    id: "70000000-0000-4000-8000-000000000001",
    customerId: "10000000-0000-4000-8000-000000000001",
    transactionDefinitionId: "20000000-0000-4000-8000-000000000002",
    transactionKey: "seniors-card",
    currentStep: "review",
    payload: {
      dateOfBirth: "1960-01-01",
      residencyStatus: "queensland-resident",
      concessionConsent: true
    },
    createdAt: "2026-06-10T00:00:00.000Z",
    updatedAt: "2026-06-10T00:00:00.000Z",
    ...overrides
  };
}

function createTransaction(overrides: Partial<TransactionCatalogueRecord> = {}): TransactionCatalogueRecord {
  return {
    id: "20000000-0000-4000-8000-000000000002",
    transactionKey: "seniors-card",
    label: "Seniors Card",
    description: "Prototype Seniors Card transaction for eligibility and application flow.",
    status: "ENABLED",
    owningAgency: "Smart Service Queensland",
    schemaVersion: "2026-06-10",
    schema: {
      required: ["dateOfBirth", "residencyStatus"],
      properties: {
        dateOfBirth: {
          type: "string",
          format: "date"
        },
        residencyStatus: {
          type: "string",
          enum: ["queensland-resident", "moving-to-queensland"]
        },
        concessionConsent: {
          type: "boolean"
        }
      }
    },
    featureFlagKey: "transaction.seniors-card.enabled",
    featureEnabled: true,
    ...overrides
  };
}

function createRepository(draft: ServiceRequestDraftRecord | undefined): PrototypeRepository {
  return {
    async getServiceRequestDraftForCustomer() {
      return draft;
    },
    async createServiceRequest(input: {
      customerId: string;
      transactionDefinitionId: string;
      referenceNumber: string;
      status: ServiceRequestRecord["status"];
      payload?: Record<string, unknown>;
    }) {
      return {
        id: "30000000-0000-4000-8000-000000000001",
        customerId: input.customerId,
        transactionDefinitionId: input.transactionDefinitionId,
        referenceNumber: input.referenceNumber,
        status: input.status,
        payload: input.payload ?? {}
      };
    },
    async createServiceRequestEvent() {
      return {
        id: "60000000-0000-4000-8000-000000000001",
        serviceRequestId: "30000000-0000-4000-8000-000000000001",
        eventType: "SERVICE_REQUEST_SUBMITTED",
        eventPayload: {},
        createdAt: "2026-06-10T00:00:00.000Z"
      };
    }
  } as unknown as PrototypeRepository;
}

function createCatalogue(transaction: TransactionCatalogueRecord): TransactionCatalogueService {
  return {
    async getStartableTransaction() {
      return {
        ok: true,
        transaction
      };
    }
  } as unknown as TransactionCatalogueService;
}

describe("SubmissionLifecycleService", () => {
  it("submits a valid Seniors Card draft", async () => {
    const draft = createDraft();
    const service = new SubmissionLifecycleService(
      createRepository(draft),
      createCatalogue(createTransaction()),
      () => "SSQ-TEST-0001"
    );

    const result = await service.submitDraft({
      customerId: draft.customerId,
      draftId: draft.id,
      correlationId: "test-correlation"
    });

    expect(result).toMatchObject({
      ok: true,
      serviceRequest: {
        referenceNumber: "SSQ-TEST-0001",
        status: "SUBMITTED",
        transactionKey: "seniors-card",
        payload: draft.payload
      },
      fieldErrors: []
    });
  });

  it("submits a valid Rental Security Subsidy draft", async () => {
    const draft = createDraft({
      transactionDefinitionId: "20000000-0000-4000-8000-000000000003",
      transactionKey: "rental-security-subsidy",
      payload: {
        householdIncome: 64000,
        rentalBondAmount: 2400,
        supportingDocuments: ["lease.pdf"]
      }
    });
    const transaction = createTransaction({
      id: draft.transactionDefinitionId,
      transactionKey: "rental-security-subsidy",
      schema: {
        required: ["householdIncome", "rentalBondAmount"],
        properties: {
          householdIncome: {
            type: "number",
            minimum: 0
          },
          rentalBondAmount: {
            type: "number",
            minimum: 0
          },
          supportingDocuments: {
            type: "array",
            items: {
              type: "string"
            }
          }
        }
      }
    });
    const service = new SubmissionLifecycleService(
      createRepository(draft),
      createCatalogue(transaction),
      () => "SSQ-TEST-0002"
    );

    await expect(service.submitDraft({
      customerId: draft.customerId,
      draftId: draft.id,
      correlationId: "test-correlation"
    })).resolves.toMatchObject({
      ok: true,
      serviceRequest: {
        referenceNumber: "SSQ-TEST-0002",
        transactionKey: "rental-security-subsidy"
      }
    });
  });

  it("returns field errors for invalid draft payloads", async () => {
    const draft = createDraft({
      payload: {
        dateOfBirth: "not-a-date",
        concessionConsent: "yes"
      }
    });
    const service = new SubmissionLifecycleService(
      createRepository(draft),
      createCatalogue(createTransaction()),
      () => "SSQ-TEST-0003"
    );

    const result = await service.submitDraft({
      customerId: draft.customerId,
      draftId: draft.id,
      correlationId: "test-correlation"
    });

    expect(result).toMatchObject({
      ok: false,
      code: "VALIDATION_FAILED"
    });
    expect(result.fieldErrors.map((error) => error.field)).toEqual([
      "dateOfBirth",
      "residencyStatus",
      "concessionConsent"
    ]);
  });

  it("rejects non-object payloads safely", async () => {
    const draft = createDraft({
      payload: ["not", "an", "object"] as unknown as Record<string, unknown>
    });
    const service = new SubmissionLifecycleService(
      createRepository(draft),
      createCatalogue(createTransaction()),
      () => "SSQ-TEST-0004"
    );

    await expect(service.submitDraft({
      customerId: draft.customerId,
      draftId: draft.id,
      correlationId: "test-correlation"
    })).resolves.toMatchObject({
      ok: false,
      code: "VALIDATION_FAILED",
      fieldErrors: [
        {
          field: "$",
          message: "Payload must be an object."
        }
      ]
    });
  });

  it("returns a safe error when the draft is missing or not owned by the customer", async () => {
    const service = new SubmissionLifecycleService(
      createRepository(undefined),
      createCatalogue(createTransaction()),
      () => "SSQ-TEST-0005"
    );

    await expect(service.submitDraft({
      customerId: "10000000-0000-4000-8000-000000000999",
      draftId: "70000000-0000-4000-8000-000000000001",
      correlationId: "test-correlation"
    })).resolves.toEqual({
      ok: false,
      code: "DRAFT_NOT_FOUND",
      message: "Draft was not found.",
      fieldErrors: []
    });
  });
});
