import { randomUUID } from "node:crypto";

import { DEMO_CUSTOMER_EMAIL_HEADER, DEMO_ROLE_HEADER, DEMO_SUBJECT_HEADER, headerValue, isCitizen, resolveDemoIdentity } from "../auth/demoIdentity.js";
import { supportingDocumentUploadPolicy } from "../policies/supportingDocumentPolicy.js";
import { PrototypeRepository } from "../repositories/prototypeRepository.js";
import { SupportingDocumentUploadService } from "../services/supportingDocumentUploadService.js";

import type { FastifyInstance } from "fastify";
import type { Queryable } from "../database/types.js";

export async function registerSupportingDocumentRoutes(app: FastifyInstance, queryable: Queryable) {
  app.post("/uploads/supporting-documents", async (request, reply) => {
    const repository = new PrototypeRepository(queryable);
    const service = new SupportingDocumentUploadService(repository);
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
      correlationId: request.headers["x-correlation-id"] ?? randomUUID()
    };
  });
}
