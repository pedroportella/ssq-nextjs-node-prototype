import { getCorrelationId } from "../plugins/observability.js";

import type { FastifyInstance } from "fastify";
import type { AppConfig } from "../config.js";

export async function registerDebugRoutes(app: FastifyInstance, config: AppConfig) {
  if (config.NODE_ENV === "production" || !config.DEBUG_ROUTES_ENABLED) {
    return;
  }

  app.get("/debug/request", async (request) => ({
    ok: true,
    correlationId: getCorrelationId(request),
    method: request.method,
    url: request.url
  }));
}
