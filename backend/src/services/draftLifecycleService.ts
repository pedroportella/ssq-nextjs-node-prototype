import type { PrototypeRepository, ServiceRequestDraftRecord } from "../repositories/prototypeRepository.js";
import type { TransactionCatalogueService } from "./transactionCatalogueService.js";

export type DraftLifecycleErrorCode = "CUSTOMER_NOT_FOUND" | "DRAFT_NOT_FOUND" | "TRANSACTION_NOT_FOUND" | "TRANSACTION_DISABLED";

export type DraftLifecycleResult =
  | {
      ok: true;
      draft: ServiceRequestDraftRecord;
    }
  | {
      ok: false;
      code: DraftLifecycleErrorCode;
      message: string;
    };

export class DraftLifecycleService {
  constructor(
    private readonly repository: PrototypeRepository,
    private readonly transactionCatalogue: TransactionCatalogueService
  ) {}

  async createDraft(input: {
    customerId: string;
    transactionKey: string;
    currentStep: string;
    payload?: Record<string, unknown>;
  }): Promise<DraftLifecycleResult> {
    const startableTransaction = await this.transactionCatalogue.getStartableTransaction(input.transactionKey);

    if (!startableTransaction.ok) {
      return {
        ok: false,
        code: startableTransaction.reason === "NOT_FOUND" ? "TRANSACTION_NOT_FOUND" : "TRANSACTION_DISABLED",
        message: startableTransaction.message
      };
    }

    const draft = await this.repository.createServiceRequestDraft({
      customerId: input.customerId,
      transactionDefinitionId: startableTransaction.transaction.id,
      currentStep: input.currentStep,
      payload: input.payload
    });

    return {
      ok: true,
      draft: {
        ...draft,
        transactionKey: startableTransaction.transaction.transactionKey
      }
    };
  }

  async updateDraft(input: {
    draftId: string;
    customerId: string;
    currentStep: string;
    payload: Record<string, unknown>;
  }): Promise<DraftLifecycleResult> {
    const draft = await this.repository.updateServiceRequestDraftForCustomer(input);

    if (!draft) {
      return {
        ok: false,
        code: "DRAFT_NOT_FOUND",
        message: "Draft was not found."
      };
    }

    return {
      ok: true,
      draft
    };
  }
}
