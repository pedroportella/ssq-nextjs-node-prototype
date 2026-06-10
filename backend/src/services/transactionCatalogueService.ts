import type { PrototypeRepository, TransactionCatalogueRecord } from "../repositories/prototypeRepository.js";

export type StartTransactionResult =
  | {
      ok: true;
      transaction: TransactionCatalogueRecord;
    }
  | {
      ok: false;
      reason: "NOT_FOUND" | "DISABLED";
      message: string;
    };

export class TransactionCatalogueService {
  constructor(private readonly repository: PrototypeRepository) {}

  async listEnabledTransactions(): Promise<TransactionCatalogueRecord[]> {
    return this.repository.listEnabledTransactionCatalogue();
  }

  async getStartableTransaction(transactionKey: string): Promise<StartTransactionResult> {
    const transaction = await this.repository.getTransactionCatalogueEntry(transactionKey);

    if (!transaction) {
      return {
        ok: false,
        reason: "NOT_FOUND",
        message: "Transaction was not found."
      };
    }

    if (transaction.status !== "ENABLED" || !transaction.featureEnabled) {
      return {
        ok: false,
        reason: "DISABLED",
        message: "Transaction is not available."
      };
    }

    return {
      ok: true,
      transaction
    };
  }
}
