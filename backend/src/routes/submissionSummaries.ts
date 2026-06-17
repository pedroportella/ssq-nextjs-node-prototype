import { AuthorizationPolicyService } from "../auth/authorizationPolicy.js";
import { DEMO_CUSTOMER_EMAIL_HEADER, DEMO_ROLE_HEADER, DEMO_SUBJECT_HEADER, headerValue, resolveDemoIdentity } from "../auth/demoIdentity.js";
import { PrototypeRepository } from "../repositories/prototypeRepository.js";

import type { FastifyInstance } from "fastify";
import type { Queryable } from "../database/types.js";

export async function registerSubmissionSummaryRoutes(app: FastifyInstance, queryable: Queryable) {
  app.get("/service-requests/:referenceNumber/summary/download", async (request, reply) => {
    const repository = new PrototypeRepository(queryable);
    const identity = resolveDemoIdentity({
      roleHeader: headerValue(request.headers[DEMO_ROLE_HEADER]),
      subjectHeader: headerValue(request.headers[DEMO_SUBJECT_HEADER]),
      legacyCustomerEmailHeader: headerValue(request.headers[DEMO_CUSTOMER_EMAIL_HEADER])
    });
    const decision = new AuthorizationPolicyService().decide(identity, "citizen.submissionSummary.download");

    if (!decision.ok) {
      reply.code(403);

      return {
        ok: false,
        error: {
          code: "FORBIDDEN",
          message: decision.message ?? "Role cannot download citizen summaries."
        }
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
        }
      };
    }

    const params = request.params as { referenceNumber: string };
    const summary = await repository.getSubmissionSummaryForCustomerByReference({
      customerId: customer.id,
      referenceNumber: params.referenceNumber
    });

    if (!summary) {
      reply.code(404);

      return {
        ok: false,
        error: {
          code: "SUMMARY_NOT_FOUND",
          message: "Submission summary was not found."
        }
      };
    }

    reply
      .type(summary.contentType)
      .header("content-disposition", `attachment; filename="${summary.fileName}"`);

    return summary.summaryText;
  });
}
