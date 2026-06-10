import { DEMO_CUSTOMER_EMAIL_HEADER, DEFAULT_DEMO_CUSTOMER_EMAIL } from "../graphql/context.js";
import { PrototypeRepository } from "../repositories/prototypeRepository.js";

import type { FastifyInstance } from "fastify";
import type { Queryable } from "../database/types.js";

export async function registerSubmissionSummaryRoutes(app: FastifyInstance, queryable: Queryable) {
  app.get("/service-requests/:referenceNumber/summary/download", async (request, reply) => {
    const repository = new PrototypeRepository(queryable);
    const demoCustomerEmail = request.headers[DEMO_CUSTOMER_EMAIL_HEADER] ?? DEFAULT_DEMO_CUSTOMER_EMAIL;
    const customer = await repository.getCustomerByEmail(Array.isArray(demoCustomerEmail) ? demoCustomerEmail[0] : demoCustomerEmail);

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
