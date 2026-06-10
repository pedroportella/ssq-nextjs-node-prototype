import { randomUUID } from "node:crypto";

import { DEMO_CUSTOMER_EMAIL_HEADER, DEFAULT_DEMO_CUSTOMER_EMAIL } from "../graphql/context.js";
import { supportingDocumentUploadPolicy } from "../policies/supportingDocumentPolicy.js";
import { PrototypeRepository } from "../repositories/prototypeRepository.js";
import { SupportingDocumentUploadService } from "../services/supportingDocumentUploadService.js";

import type { FastifyInstance } from "fastify";
import type { Queryable } from "../database/types.js";

export async function registerSupportingDocumentRoutes(app: FastifyInstance, queryable: Queryable) {
  app.post("/uploads/supporting-documents", async (request, reply) => {
    const repository = new PrototypeRepository(queryable);
    const service = new SupportingDocumentUploadService(repository);
    const demoCustomerEmail = request.headers[DEMO_CUSTOMER_EMAIL_HEADER] ?? DEFAULT_DEMO_CUSTOMER_EMAIL;
    const customer = await repository.getCustomerByEmail(Array.isArray(demoCustomerEmail) ? demoCustomerEmail[0] : demoCustomerEmail);

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
        policy: supportingDocumentUploadPolicy
      };
    }

    reply.code(201);

    return {
      ok: true,
      document: result.document,
      policy: supportingDocumentUploadPolicy,
      correlationId: request.headers["x-correlation-id"] ?? randomUUID()
    };
  });
}
