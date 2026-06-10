import { randomUUID } from "node:crypto";

import { validatePayloadAgainstSchema } from "./submissionValidation.js";

import type { PrototypeRepository, ServiceRequestRecord } from "../repositories/prototypeRepository.js";
import type { FieldValidationError } from "./submissionValidation.js";
import type { TransactionCatalogueService } from "./transactionCatalogueService.js";

export type SubmitServiceRequestErrorCode =
  | "DRAFT_NOT_FOUND"
  | "TRANSACTION_NOT_FOUND"
  | "TRANSACTION_DISABLED"
  | "VALIDATION_FAILED";

export type SubmitServiceRequestResult =
  | {
      ok: true;
      serviceRequest: ServiceRequestRecord;
      fieldErrors: [];
    }
  | {
      ok: false;
      code: SubmitServiceRequestErrorCode;
      message: string;
      fieldErrors: FieldValidationError[];
    };

export class SubmissionLifecycleService {
  constructor(
    private readonly repository: PrototypeRepository,
    private readonly transactionCatalogue: TransactionCatalogueService,
    private readonly referenceGenerator: () => string = generateReferenceNumber
  ) {}

  async submitDraft(input: {
    customerId: string;
    draftId: string;
    correlationId: string;
  }): Promise<SubmitServiceRequestResult> {
    const draft = await this.repository.getServiceRequestDraftForCustomer({
      draftId: input.draftId,
      customerId: input.customerId
    });

    if (!draft) {
      return {
        ok: false,
        code: "DRAFT_NOT_FOUND",
        message: "Draft was not found.",
        fieldErrors: []
      };
    }

    const transaction = draft.transactionKey
      ? await this.transactionCatalogue.getStartableTransaction(draft.transactionKey)
      : {
          ok: false as const,
          reason: "NOT_FOUND" as const,
          message: "Transaction was not found."
        };

    if (!transaction.ok) {
      return {
        ok: false,
        code: transaction.reason === "NOT_FOUND" ? "TRANSACTION_NOT_FOUND" : "TRANSACTION_DISABLED",
        message: transaction.message,
        fieldErrors: []
      };
    }

    const validation = validatePayloadAgainstSchema({
      payload: draft.payload,
      schema: transaction.transaction.schema
    });

    if (!validation.ok) {
      return {
        ok: false,
        code: "VALIDATION_FAILED",
        message: "Draft payload failed validation.",
        fieldErrors: validation.fieldErrors
      };
    }

    const serviceRequest = await this.repository.createServiceRequest({
      customerId: input.customerId,
      transactionDefinitionId: draft.transactionDefinitionId,
      referenceNumber: this.referenceGenerator(),
      status: "SUBMITTED",
      payload: validation.payload
    });

    await this.repository.createServiceRequestEvent({
      serviceRequestId: serviceRequest.id,
      eventType: "SERVICE_REQUEST_SUBMITTED",
      eventPayload: {
        correlationId: input.correlationId,
        draftId: draft.id,
        transactionKey: transaction.transaction.transactionKey
      }
    });

    return {
      ok: true,
      serviceRequest: {
        ...serviceRequest,
        transactionKey: transaction.transaction.transactionKey
      },
      fieldErrors: []
    };
  }
}

function generateReferenceNumber(): string {
  const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  const suffix = randomUUID().replaceAll("-", "").slice(0, 8).toUpperCase();

  return `SSQ-${date}-${suffix}`;
}
