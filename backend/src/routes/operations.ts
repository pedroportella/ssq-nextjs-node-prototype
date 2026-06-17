import { AuthorizationPolicyService } from "../auth/authorizationPolicy.js";
import { headerValue, resolveDemoIdentity, DEMO_CUSTOMER_EMAIL_HEADER, DEMO_ROLE_HEADER, DEMO_SUBJECT_HEADER } from "../auth/demoIdentity.js";
import { PrototypeRepository } from "../repositories/prototypeRepository.js";
import { OutboxEventService } from "../services/outboxEventService.js";
import { OperationsPostureService } from "../services/operationsPostureService.js";

import type { FastifyInstance } from "fastify";
import type { AppConfig } from "../config.js";
import type { DatabaseHealthCheck, Queryable } from "../database/types.js";

export async function registerOperationsRoutes(app: FastifyInstance, queryable: Queryable, config: AppConfig, database: DatabaseHealthCheck) {
  app.get("/operations/outbox-events", async (request, reply) => {
    const identity = resolveDemoIdentity({
      roleHeader: headerValue(request.headers[DEMO_ROLE_HEADER]),
      subjectHeader: headerValue(request.headers[DEMO_SUBJECT_HEADER]),
      legacyCustomerEmailHeader: headerValue(request.headers[DEMO_CUSTOMER_EMAIL_HEADER])
    });
    const decision = new AuthorizationPolicyService().decide(identity, "operations.read");

    if (!decision.ok) {
      reply.code(403);

      return {
        ok: false,
        error: {
          code: "FORBIDDEN",
          message: decision.message ?? "Role cannot read operations."
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

  app.get("/operations/posture", async (request, reply) => {
    const identity = resolveDemoIdentity({
      roleHeader: headerValue(request.headers[DEMO_ROLE_HEADER]),
      subjectHeader: headerValue(request.headers[DEMO_SUBJECT_HEADER]),
      legacyCustomerEmailHeader: headerValue(request.headers[DEMO_CUSTOMER_EMAIL_HEADER])
    });
    const decision = new AuthorizationPolicyService().decide(identity, "operations.read");

    if (!decision.ok) {
      reply.code(403);

      return {
        ok: false,
        error: {
          code: "FORBIDDEN",
          message: decision.message ?? "Role cannot read operations."
        }
      };
    }

    const repository = new PrototypeRepository(queryable);
    const service = new OperationsPostureService({
      config,
      database,
      queryable,
      repository
    });

    return {
      ok: true,
      posture: await service.getPosture()
    };
  });
}
