import { PrototypeRepository } from "../repositories/prototypeRepository.js";
import { OutboxEventService } from "../services/outboxEventService.js";

import type { FastifyInstance } from "fastify";
import type { Queryable } from "../database/types.js";

export async function registerOperationsRoutes(app: FastifyInstance, queryable: Queryable) {
  app.get("/operations/outbox-events", async () => {
    const repository = new PrototypeRepository(queryable);
    const service = new OutboxEventService(repository);

    return {
      ok: true,
      generatedAt: new Date().toISOString(),
      outbox: await service.getOperationsSummary()
    };
  });
}
