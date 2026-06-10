import { canReadOperations, headerValue, resolveDemoIdentity, DEMO_CUSTOMER_EMAIL_HEADER, DEMO_ROLE_HEADER, DEMO_SUBJECT_HEADER } from "../auth/demoIdentity.js";
import { PrototypeRepository } from "../repositories/prototypeRepository.js";
import { OutboxEventService } from "../services/outboxEventService.js";

import type { FastifyInstance } from "fastify";
import type { Queryable } from "../database/types.js";

export async function registerOperationsRoutes(app: FastifyInstance, queryable: Queryable) {
  app.get("/operations/outbox-events", async (request, reply) => {
    const identity = resolveDemoIdentity({
      roleHeader: headerValue(request.headers[DEMO_ROLE_HEADER]),
      subjectHeader: headerValue(request.headers[DEMO_SUBJECT_HEADER]),
      legacyCustomerEmailHeader: headerValue(request.headers[DEMO_CUSTOMER_EMAIL_HEADER])
    });

    if (!canReadOperations(identity)) {
      reply.code(403);

      return {
        ok: false,
        error: {
          code: "FORBIDDEN",
          message: "Role cannot read operations."
        }
      };
    }

    const repository = new PrototypeRepository(queryable);
    const service = new OutboxEventService(repository);

    return {
      ok: true,
      generatedAt: new Date().toISOString(),
      outbox: await service.getOperationsSummary()
    };
  });
}
