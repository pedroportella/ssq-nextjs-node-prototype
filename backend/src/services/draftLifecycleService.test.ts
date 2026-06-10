import { describe, expect, it } from "vitest";

import { DraftLifecycleService } from "./draftLifecycleService.js";

import type { PrototypeRepository, ServiceRequestDraftRecord, TransactionCatalogueRecord } from "../repositories/prototypeRepository.js";
import type { TransactionCatalogueService } from "./transactionCatalogueService.js";

function createDraft(overrides: Partial<ServiceRequestDraftRecord> = {}): ServiceRequestDraftRecord {
  return {
    id: "70000000-0000-4000-8000-000000000001",
    customerId: "10000000-0000-4000-8000-000000000001",
    transactionDefinitionId: "20000000-0000-4000-8000-000000000002",
    transactionKey: "seniors-card",
    currentStep: "eligibility",
    payload: {},
    createdAt: "2026-06-10T00:00:00.000Z",
    updatedAt: "2026-06-10T00:00:00.000Z",
    ...overrides
  };
}

function createTransaction(): TransactionCatalogueRecord {
  return {
    id: "20000000-0000-4000-8000-000000000002",
    transactionKey: "seniors-card",
    label: "Seniors Card",
    description: "Prototype Seniors Card transaction for eligibility and application flow.",
    status: "ENABLED",
    owningAgency: "Smart Service Queensland",
    schemaVersion: "2026-06-10",
    schema: {},
    featureFlagKey: "transaction.seniors-card.enabled",
    featureEnabled: true
  };
}

describe("DraftLifecycleService", () => {
  it("creates drafts for startable transactions", async () => {
    const createdDraft = createDraft();
    const repository = {
      async createServiceRequestDraft() {
        return createdDraft;
      }
    } as unknown as PrototypeRepository;
    const transactionCatalogue = {
      async getStartableTransaction() {
        return {
          ok: true,
          transaction: createTransaction()
        };
      }
    } as unknown as TransactionCatalogueService;
    const service = new DraftLifecycleService(repository, transactionCatalogue);

    const result = await service.createDraft({
      customerId: createdDraft.customerId,
      transactionKey: "seniors-card",
      currentStep: "eligibility",
      payload: {}
    });

    expect(result).toMatchObject({
      ok: true,
      draft: {
        transactionKey: "seniors-card"
      }
    });
  });

  it("rejects missing or disabled transactions safely", async () => {
    const repository = {} as PrototypeRepository;
    const transactionCatalogue = {
      async getStartableTransaction() {
        return {
          ok: false,
          reason: "NOT_FOUND",
          message: "Transaction was not found."
        };
      }
    } as unknown as TransactionCatalogueService;
    const service = new DraftLifecycleService(repository, transactionCatalogue);

    const result = await service.createDraft({
      customerId: "10000000-0000-4000-8000-000000000001",
      transactionKey: "missing",
      currentStep: "eligibility",
      payload: {}
    });

    expect(result).toEqual({
      ok: false,
      code: "TRANSACTION_NOT_FOUND",
      message: "Transaction was not found."
    });
  });

  it("only updates drafts owned by the customer", async () => {
    const repository = {
      async updateServiceRequestDraftForCustomer(input: { customerId: string }) {
        return input.customerId === "10000000-0000-4000-8000-000000000001"
          ? createDraft({ currentStep: "details" })
          : undefined;
      }
    } as unknown as PrototypeRepository;
    const transactionCatalogue = {} as TransactionCatalogueService;
    const service = new DraftLifecycleService(repository, transactionCatalogue);

    await expect(service.updateDraft({
      draftId: "70000000-0000-4000-8000-000000000001",
      customerId: "10000000-0000-4000-8000-000000000001",
      currentStep: "details",
      payload: {}
    })).resolves.toMatchObject({
      ok: true,
      draft: {
        currentStep: "details"
      }
    });

    await expect(service.updateDraft({
      draftId: "70000000-0000-4000-8000-000000000001",
      customerId: "10000000-0000-4000-8000-000000000999",
      currentStep: "details",
      payload: {}
    })).resolves.toEqual({
      ok: false,
      code: "DRAFT_NOT_FOUND",
      message: "Draft was not found."
    });
  });
});
