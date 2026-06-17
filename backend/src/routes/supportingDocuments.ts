import { randomUUID } from "node:crypto";

import {
  canReadSubmittedRecords,
  DEMO_CUSTOMER_EMAIL_HEADER,
  DEMO_ROLE_HEADER,
  DEMO_SUBJECT_HEADER,
  headerValue,
  isCitizen,
  resolveDemoIdentity
} from "../auth/demoIdentity.js";
import { supportingDocumentUploadPolicy } from "../policies/supportingDocumentPolicy.js";
import { PrototypeRepository } from "../repositories/prototypeRepository.js";
import { EvidenceStorageService } from "../services/evidenceStorageService.js";
import { SupportingDocumentUploadService } from "../services/supportingDocumentUploadService.js";

import type { FastifyInstance } from "fastify";
import type { Queryable } from "../database/types.js";

export async function registerSupportingDocumentRoutes(app: FastifyInstance, queryable: Queryable) {
  app.post("/uploads/supporting-documents", async (request, reply) => {
    const repository = new PrototypeRepository(queryable);
    const service = new SupportingDocumentUploadService(repository);
    const correlationId = headerValue(request.headers["x-correlation-id"]) ?? randomUUID();
    const identity = resolveDemoIdentity({
      roleHeader: headerValue(request.headers[DEMO_ROLE_HEADER]),
      subjectHeader: headerValue(request.headers[DEMO_SUBJECT_HEADER]),
      legacyCustomerEmailHeader: headerValue(request.headers[DEMO_CUSTOMER_EMAIL_HEADER])
    });

    if (!isCitizen(identity)) {
      reply.code(403);

      return {
        ok: false,
        error: {
          code: "FORBIDDEN",
          message: "Role cannot upload citizen documents."
        },
        fieldErrors: [],
        policy: supportingDocumentUploadPolicy
      };
    }

    const customer = await repository.getCustomerByEmail(identity.subject);

    if (!customer) {
      reply.code(404);

      return {
        ok: false,
        error: {
          code: "CUSTOMER_NOT_FOUND",
          message: "Customer was not found."
        },
        fieldErrors: [],
        policy: supportingDocumentUploadPolicy
      };
    }

    const result = await service.recordUpload({
      correlationId,
      customerId: customer.id,
      upload: request.body as never
    });

    if (!result.ok) {
      reply.code(result.code === "TARGET_NOT_FOUND" ? 404 : 400);

      return {
        ok: false,
        error: {
          code: result.code,
          message: result.message
        },
        fieldErrors: result.fieldErrors,
        policy: result.policy
      };
    }

    reply.code(201);

    return {
      ok: true,
      document: result.document,
      policy: result.policy,
      correlationId
    };
  });

  app.get("/service-requests/:referenceNumber/supporting-documents/:documentId/download", async (request, reply) => {
    const repository = new PrototypeRepository(queryable);
    const evidenceStorage = new EvidenceStorageService();
    const correlationId = headerValue(request.headers["x-correlation-id"]) ?? randomUUID();
    const identity = resolveDemoIdentity({
      roleHeader: headerValue(request.headers[DEMO_ROLE_HEADER]),
      subjectHeader: headerValue(request.headers[DEMO_SUBJECT_HEADER]),
      legacyCustomerEmailHeader: headerValue(request.headers[DEMO_CUSTOMER_EMAIL_HEADER])
    });
    const params = request.params as { documentId: string; referenceNumber: string };
    const document = isCitizen(identity)
      ? await resolveCitizenDocument(repository, identity.subject, params)
      : canReadSubmittedRecords(identity)
        ? await repository.getSupportingDocumentForServiceRequest({
            documentId: params.documentId,
            referenceNumber: params.referenceNumber
          })
        : undefined;

    if (!isCitizen(identity) && !canReadSubmittedRecords(identity)) {
      reply.code(403);

      return {
        ok: false,
        error: {
          code: "FORBIDDEN",
          message: "Role cannot download supporting documents."
        },
        correlationId
      };
    }

    if (!document) {
      reply.code(404);

      return {
        ok: false,
        error: {
          code: "DOCUMENT_NOT_FOUND",
          message: "Supporting document was not found."
        },
        correlationId
      };
    }

    const download = evidenceStorage.createDownload(document);

    if (!download.ok) {
      await repository.createServiceRequestEvent({
        serviceRequestId: document.serviceRequestId as string,
        eventType: "SUPPORTING_DOCUMENT_DOWNLOAD_BLOCKED",
        eventPayload: {
          actorRole: identity.role,
          actorSubject: identity.subject,
          correlationId,
          documentId: document.id,
          fileName: document.fileName,
          reason: download.code,
          scanStatus: document.scanStatus
        }
      });
      reply.code(409);

      return {
        ok: false,
        error: {
          code: download.code,
          message: download.message
        },
        correlationId
      };
    }

    await repository.createServiceRequestEvent({
      serviceRequestId: document.serviceRequestId as string,
      eventType: "SUPPORTING_DOCUMENT_DOWNLOADED",
      eventPayload: {
        actorRole: identity.role,
        actorSubject: identity.subject,
        correlationId,
        documentId: document.id,
        fileName: document.fileName,
        scanStatus: document.scanStatus,
        storageKey: document.storageKey
      }
    });

    reply
      .type(download.download.contentType)
      .header("content-disposition", `attachment; filename="${download.download.fileName}"`);

    return download.download.body;
  });
}

async function resolveCitizenDocument(
  repository: PrototypeRepository,
  subject: string,
  params: { documentId: string; referenceNumber: string }
) {
  const customer = await repository.getCustomerByEmail(subject);

  if (!customer) {
    return undefined;
  }

  return repository.getSupportingDocumentForServiceRequest({
    customerId: customer.id,
    documentId: params.documentId,
    referenceNumber: params.referenceNumber
  });
}
