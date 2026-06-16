import { randomUUID } from "node:crypto";
import { extname } from "node:path";

import { z } from "zod";

import {
  ALLOWED_SUPPORTING_DOCUMENT_CATEGORIES,
  ALLOWED_SUPPORTING_DOCUMENT_EXTENSIONS,
  ALLOWED_SUPPORTING_DOCUMENT_MIME_TYPES,
  DEFAULT_SUPPORTING_DOCUMENT_PERSON_KEY,
  MAX_SUPPORTING_DOCUMENT_BYTES,
  MAX_SUPPORTING_DOCUMENT_TOTAL_BYTES_PER_PERSON,
  MAX_SUPPORTING_DOCUMENTS_PER_PERSON,
  SUPPORTING_DOCUMENT_EXTENSION_MIME_TYPES
} from "../policies/supportingDocumentPolicy.js";

import type { PrototypeRepository, SupportingDocumentRecord } from "../repositories/prototypeRepository.js";

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
  category: z.enum(ALLOWED_SUPPORTING_DOCUMENT_CATEGORIES),
  fileName: z.string().min(1).max(255),
  mimeType: z.enum(ALLOWED_SUPPORTING_DOCUMENT_MIME_TYPES),
  personKey: z.string().min(1).max(64).regex(/^[a-z0-9][a-z0-9-]*$/).default(DEFAULT_SUPPORTING_DOCUMENT_PERSON_KEY),
  sizeBytes: z.number().int().positive().max(MAX_SUPPORTING_DOCUMENT_BYTES)
});

export type SupportingDocumentUploadInput = z.input<typeof uploadInputSchema>;

export type SupportingDocumentUploadResult =
  | {
      ok: true;
      document: SupportingDocumentRecord;
    }
  | {
      ok: false;
      code: "INVALID_UPLOAD" | "UNSUPPORTED_FILE_TYPE" | "FILE_TOO_LARGE" | "PERSON_LIMIT_EXCEEDED" | "TARGET_NOT_FOUND";
      message: string;
      fieldErrors: Array<{ field: string; message: string }>;
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
      const code = issue?.path.includes("sizeBytes") ? "FILE_TOO_LARGE" : "INVALID_UPLOAD";

      return {
        ok: false,
        code,
        message: code === "FILE_TOO_LARGE" ? "File exceeds the upload size limit." : "Upload metadata is invalid.",
        fieldErrors: parsed.error.issues.map((issue) => ({
          field: issue.path.join(".") || "$",
          message: issue.message
        }))
      };
    }

    const fileExtension = extname(parsed.data.fileName).toLowerCase();
    const expectedMimeType = SUPPORTING_DOCUMENT_EXTENSION_MIME_TYPES[fileExtension as keyof typeof SUPPORTING_DOCUMENT_EXTENSION_MIME_TYPES];

    if (!expectedMimeType || !ALLOWED_SUPPORTING_DOCUMENT_EXTENSIONS.includes(fileExtension as (typeof ALLOWED_SUPPORTING_DOCUMENT_EXTENSIONS)[number])) {
      return {
        ok: false,
        code: "UNSUPPORTED_FILE_TYPE",
        message: "File extension is not supported.",
        fieldErrors: [
          {
            field: "fileName",
            message: `Allowed extensions: ${ALLOWED_SUPPORTING_DOCUMENT_EXTENSIONS.join(", ")}.`
          }
        ]
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
        ]
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
        fieldErrors: []
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

    if (nextPersonFileCount > MAX_SUPPORTING_DOCUMENTS_PER_PERSON) {
      return {
        ok: false,
        code: "PERSON_LIMIT_EXCEEDED",
        message: "Upload exceeds the per-person file count limit.",
        fieldErrors: [
          {
            field: "personKey",
            message: `A maximum of ${MAX_SUPPORTING_DOCUMENTS_PER_PERSON} files can be attached for each person.`
          }
        ]
      };
    }

    if (nextPersonTotalBytes > MAX_SUPPORTING_DOCUMENT_TOTAL_BYTES_PER_PERSON) {
      return {
        ok: false,
        code: "PERSON_LIMIT_EXCEEDED",
        message: "Upload exceeds the per-person total size limit.",
        fieldErrors: [
          {
            field: "sizeBytes",
            message: `Files for each person must total ${MAX_SUPPORTING_DOCUMENT_TOTAL_BYTES_PER_PERSON} bytes or less.`
          }
        ]
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
          maxFilesPerPerson: MAX_SUPPORTING_DOCUMENTS_PER_PERSON,
          maxSizeBytes: MAX_SUPPORTING_DOCUMENT_BYTES,
          maxTotalSizeBytesPerPerson: MAX_SUPPORTING_DOCUMENT_TOTAL_BYTES_PER_PERSON
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
      document
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
          serviceRequestId: undefined
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
          serviceRequestId: serviceRequest.id
        }
      : undefined;
  }
}
