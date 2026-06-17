import { randomUUID } from "node:crypto";
import { extname } from "node:path";

import { z } from "zod";

import {
  DEFAULT_SUPPORTING_DOCUMENT_PERSON_KEY,
  getSupportingDocumentUploadPolicy,
  supportingDocumentUploadPolicy,
  SUPPORTING_DOCUMENT_EXTENSION_MIME_TYPES
} from "../policies/supportingDocumentPolicy.js";

import type { PrototypeRepository, SupportingDocumentRecord } from "../repositories/prototypeRepository.js";
import type { SupportingDocumentUploadPolicy } from "../policies/supportingDocumentPolicy.js";

const uploadInputSchema = z.object({
  target: z.discriminatedUnion("type", [
    z.object({
      type: z.literal("DRAFT"),
      draftId: z.string().uuid()
    }),
    z.object({
      type: z.literal("SERVICE_REQUEST"),
      referenceNumber: z.string().min(1)
    })
  ]),
  category: z.string().min(1).max(80),
  fileName: z.string().min(1).max(255),
  mimeType: z.string().min(1).max(120),
  personKey: z.string().min(1).max(64).regex(/^[a-z0-9][a-z0-9-]*$/).default(DEFAULT_SUPPORTING_DOCUMENT_PERSON_KEY),
  sizeBytes: z.number().int().positive()
});

export type SupportingDocumentUploadInput = z.input<typeof uploadInputSchema>;

export type SupportingDocumentUploadResult =
  | {
      ok: true;
      document: SupportingDocumentRecord;
      policy: SupportingDocumentUploadPolicy;
    }
  | {
      ok: false;
      code:
        | "FILE_TOO_LARGE"
        | "INVALID_UPLOAD"
        | "PERSON_LIMIT_EXCEEDED"
        | "TARGET_NOT_FOUND"
        | "UNSUPPORTED_CATEGORY"
        | "UNSUPPORTED_FILE_TYPE"
        | "UNSUPPORTED_PERSON_KEY";
      message: string;
      fieldErrors: Array<{ field: string; message: string }>;
      policy: SupportingDocumentUploadPolicy;
    };

function getDocumentPersonKey(document: SupportingDocumentRecord): string {
  const personKey = document.metadata.personKey;

  return typeof personKey === "string" && personKey.length > 0 ? personKey : DEFAULT_SUPPORTING_DOCUMENT_PERSON_KEY;
}

function isActiveDocument(document: SupportingDocumentRecord): boolean {
  return document.uploadStatus !== "REJECTED" && document.scanStatus !== "REJECTED";
}

export class SupportingDocumentUploadService {
  constructor(private readonly repository: PrototypeRepository) {}

  async recordUpload(input: {
    customerId: string;
    upload: SupportingDocumentUploadInput;
  }): Promise<SupportingDocumentUploadResult> {
    const parsed = uploadInputSchema.safeParse(input.upload);

    if (!parsed.success) {
      const issue = parsed.error.issues[0];

      return {
        ok: false,
        code: "INVALID_UPLOAD",
        message: "Upload metadata is invalid.",
        fieldErrors: parsed.error.issues.map((issue) => ({
          field: issue.path.join(".") || "$",
          message: issue.message
        })),
        policy: supportingDocumentUploadPolicy
      };
    }

    const target = parsed.data.target.type === "DRAFT"
      ? await this.resolveDraftTarget(input.customerId, parsed.data.target.draftId)
      : await this.resolveServiceRequestTarget(input.customerId, parsed.data.target.referenceNumber);

    if (!target) {
      return {
        ok: false,
        code: "TARGET_NOT_FOUND",
        message: "Upload target was not found.",
        fieldErrors: [],
        policy: supportingDocumentUploadPolicy
      };
    }

    const policy = getSupportingDocumentUploadPolicy(target.transactionKey);
    const categoryFieldError = validateCategory(parsed.data.category, policy);

    if (categoryFieldError) {
      return {
        ok: false,
        code: "UNSUPPORTED_CATEGORY",
        message: "Upload category is not supported for this transaction.",
        fieldErrors: [categoryFieldError],
        policy
      };
    }

    const personKeyFieldError = validatePersonKey(parsed.data.personKey, policy);

    if (personKeyFieldError) {
      return {
        ok: false,
        code: "UNSUPPORTED_PERSON_KEY",
        message: "Upload person bucket is not supported for this transaction.",
        fieldErrors: [personKeyFieldError],
        policy
      };
    }

    if (parsed.data.sizeBytes > policy.maxSizeBytes) {
      return {
        ok: false,
        code: "FILE_TOO_LARGE",
        message: "File exceeds the upload size limit.",
        fieldErrors: [
          {
            field: "sizeBytes",
            message: `Files must be ${policy.maxSizeBytes} bytes or less.`
          }
        ],
        policy
      };
    }

    if (!policy.allowedMimeTypes.includes(parsed.data.mimeType as (typeof policy.allowedMimeTypes)[number])) {
      return {
        ok: false,
        code: "UNSUPPORTED_FILE_TYPE",
        message: "File MIME type is not supported.",
        fieldErrors: [
          {
            field: "mimeType",
            message: `Allowed MIME types: ${policy.allowedMimeTypes.join(", ")}.`
          }
        ],
        policy
      };
    }

    const fileExtension = extname(parsed.data.fileName).toLowerCase();
    const expectedMimeType = SUPPORTING_DOCUMENT_EXTENSION_MIME_TYPES[fileExtension as keyof typeof SUPPORTING_DOCUMENT_EXTENSION_MIME_TYPES];

    if (!expectedMimeType || !policy.allowedExtensions.includes(fileExtension as (typeof policy.allowedExtensions)[number])) {
      return {
        ok: false,
        code: "UNSUPPORTED_FILE_TYPE",
        message: "File extension is not supported.",
        fieldErrors: [
          {
            field: "fileName",
            message: `Allowed extensions: ${policy.allowedExtensions.join(", ")}.`
          }
        ],
        policy
      };
    }

    if (expectedMimeType !== parsed.data.mimeType) {
      return {
        ok: false,
        code: "UNSUPPORTED_FILE_TYPE",
        message: "File extension and MIME type do not match.",
        fieldErrors: [
          {
            field: "mimeType",
            message: `${fileExtension} files must use ${expectedMimeType}.`
          }
        ],
        policy
      };
    }

    const existingDocuments = await this.repository.listSupportingDocumentsForCustomer({
      customerId: input.customerId,
      serviceRequestDraftId: target.serviceRequestDraftId,
      serviceRequestId: target.serviceRequestId
    });
    const existingPersonDocuments = existingDocuments.filter(
      (document) => isActiveDocument(document) && getDocumentPersonKey(document) === parsed.data.personKey
    );
    const nextPersonFileCount = existingPersonDocuments.length + 1;
    const nextPersonTotalBytes = existingPersonDocuments.reduce((sum, document) => sum + document.sizeBytes, 0) + parsed.data.sizeBytes;

    if (nextPersonFileCount > policy.maxFilesPerPerson) {
      return {
        ok: false,
        code: "PERSON_LIMIT_EXCEEDED",
        message: "Upload exceeds the per-person file count limit.",
        fieldErrors: [
          {
            field: "personKey",
            message: `A maximum of ${policy.maxFilesPerPerson} files can be attached for each person.`
          }
        ],
        policy
      };
    }

    if (nextPersonTotalBytes > policy.maxTotalSizeBytesPerPerson) {
      return {
        ok: false,
        code: "PERSON_LIMIT_EXCEEDED",
        message: "Upload exceeds the per-person total size limit.",
        fieldErrors: [
          {
            field: "sizeBytes",
            message: `Files for each person must total ${policy.maxTotalSizeBytesPerPerson} bytes or less.`
          }
        ],
        policy
      };
    }

    const document = await this.repository.createSupportingDocument({
      customerId: input.customerId,
      serviceRequestDraftId: target.serviceRequestDraftId,
      serviceRequestId: target.serviceRequestId,
      category: parsed.data.category,
      fileName: parsed.data.fileName,
      fileExtension,
      mimeType: parsed.data.mimeType,
      sizeBytes: parsed.data.sizeBytes,
      storageKey: `local-review/${input.customerId}/${randomUUID()}${fileExtension}`,
      uploadStatus: "METADATA_RECORDED",
      scanStatus: "NOT_SCANNED_PROTOTYPE",
      retentionPolicy: "PRODUCTION_NEXT_REQUIRED",
      metadata: {
        category: parsed.data.category,
        localStorageMode: "metadata-only",
        personKey: parsed.data.personKey,
        policy: {
          allowedCategories: policy.allowedCategories,
          allowedPersonKeys: policy.allowedPersonKeys,
          maxFilesPerPerson: policy.maxFilesPerPerson,
          maxSizeBytes: policy.maxSizeBytes,
          maxTotalSizeBytesPerPerson: policy.maxTotalSizeBytesPerPerson,
          transactionKey: target.transactionKey ?? "default"
        },
        productionNext: {
          privateStorage: "required",
          malwareScanning: "required",
          retentionSchedule: "required",
          accessControlReview: "required"
        }
      }
    });

    return {
      ok: true,
      document,
      policy
    };
  }

  private async resolveDraftTarget(customerId: string, draftId: string) {
    const draft = await this.repository.getServiceRequestDraftForCustomer({
      customerId,
      draftId
    });

    return draft
      ? {
          serviceRequestDraftId: draft.id,
          serviceRequestId: undefined,
          transactionKey: draft.transactionKey
        }
      : undefined;
  }

  private async resolveServiceRequestTarget(customerId: string, referenceNumber: string) {
    const serviceRequest = await this.repository.getServiceRequestByReferenceForCustomer({
      customerId,
      referenceNumber
    });

    return serviceRequest
      ? {
          serviceRequestDraftId: undefined,
          serviceRequestId: serviceRequest.id,
          transactionKey: serviceRequest.transactionKey
        }
      : undefined;
  }
}

function validateCategory(category: string, policy: SupportingDocumentUploadPolicy) {
  if (policy.allowedCategories.includes(category as (typeof policy.allowedCategories)[number])) {
    return undefined;
  }

  return {
    field: "category",
    message: `Allowed categories: ${policy.allowedCategories.join(", ")}.`
  };
}

function validatePersonKey(personKey: string, policy: SupportingDocumentUploadPolicy) {
  if (policy.allowedPersonKeys.includes(personKey)) {
    return undefined;
  }

  return {
    field: "personKey",
    message: `Allowed person keys: ${policy.allowedPersonKeys.join(", ")}.`
  };
}
