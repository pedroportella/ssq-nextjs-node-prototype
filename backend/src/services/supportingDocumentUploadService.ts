import { randomUUID } from "node:crypto";
import { extname } from "node:path";

import { z } from "zod";

import {
  ALLOWED_SUPPORTING_DOCUMENT_CATEGORIES,
  ALLOWED_SUPPORTING_DOCUMENT_EXTENSIONS,
  ALLOWED_SUPPORTING_DOCUMENT_MIME_TYPES,
  MAX_SUPPORTING_DOCUMENT_BYTES
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
      code: "INVALID_UPLOAD" | "UNSUPPORTED_FILE_TYPE" | "FILE_TOO_LARGE" | "TARGET_NOT_FOUND";
      message: string;
      fieldErrors: Array<{ field: string; message: string }>;
    };

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

    if (!ALLOWED_SUPPORTING_DOCUMENT_EXTENSIONS.includes(fileExtension as (typeof ALLOWED_SUPPORTING_DOCUMENT_EXTENSIONS)[number])) {
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
        localStorageMode: "metadata-only",
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
