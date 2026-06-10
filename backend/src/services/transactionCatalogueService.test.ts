import { describe, expect, it } from "vitest";

import { TransactionCatalogueService } from "./transactionCatalogueService.js";

import type { PrototypeRepository, TransactionCatalogueRecord } from "../repositories/prototypeRepository.js";

const enabledTransaction: TransactionCatalogueRecord = {
  id: "20000000-0000-4000-8000-000000000002",
  transactionKey: "seniors-card",
  label: "Seniors Card",
  description: "Prototype Seniors Card transaction for eligibility and application flow.",
  status: "ENABLED",
  owningAgency: "Smart Service Queensland",
  schemaVersion: "2026-06-10",
  schema: {
    title: "Seniors Card"
  },
  featureFlagKey: "transaction.seniors-card.enabled",
  featureEnabled: true
};

const disabledTransaction: TransactionCatalogueRecord = {
  ...enabledTransaction,
  id: "20000000-0000-4000-8000-000000000003",
  transactionKey: "rental-security-subsidy",
  label: "Rental Security Subsidy",
  featureFlagKey: "transaction.rental-security-subsidy.enabled",
  featureEnabled: false
};

describe("TransactionCatalogueService", () => {
  it("lists enabled transaction catalogue entries", async () => {
    const service = new TransactionCatalogueService(
      createRepository({
        enabled: [enabledTransaction]
      })
    );

    await expect(service.listEnabledTransactions()).resolves.toEqual([enabledTransaction]);
  });

  it("allows enabled transactions to start", async () => {
    const service = new TransactionCatalogueService(
      createRepository({
        byKey: {
          "seniors-card": enabledTransaction
        }
      })
    );

    await expect(service.getStartableTransaction("seniors-card")).resolves.toEqual({
      ok: true,
      transaction: enabledTransaction
    });
  });

  it("blocks disabled transactions from starting", async () => {
    const service = new TransactionCatalogueService(
      createRepository({
        byKey: {
          "rental-security-subsidy": disabledTransaction
        }
      })
    );

    await expect(service.getStartableTransaction("rental-security-subsidy")).resolves.toEqual({
      ok: false,
      reason: "DISABLED",
      message: "Transaction is not available."
    });
  });

  it("returns safe not-found for unknown transactions", async () => {
    const service = new TransactionCatalogueService(createRepository({}));

    await expect(service.getStartableTransaction("unknown")).resolves.toEqual({
      ok: false,
      reason: "NOT_FOUND",
      message: "Transaction was not found."
    });
  });
});

function createRepository(options: {
  enabled?: TransactionCatalogueRecord[];
  byKey?: Record<string, TransactionCatalogueRecord | undefined>;
}): PrototypeRepository {
  return {
    async listEnabledTransactionCatalogue() {
      return options.enabled ?? [];
    },
    async getTransactionCatalogueEntry(transactionKey: string) {
      return options.byKey?.[transactionKey];
    }
  } as PrototypeRepository;
}
