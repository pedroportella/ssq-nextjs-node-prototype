import cors from "@fastify/cors";
import Fastify from "fastify";

import { loadConfig } from "./config.js";
import { createDatabaseClient } from "./database/client.js";
import { createLoggerOptions } from "./logger.js";
import { registerHardening } from "./plugins/hardening.js";
import { registerObservability } from "./plugins/observability.js";
import { registerDebugRoutes } from "./routes/debug.js";
import { registerGraphqlRoute } from "./routes/graphql.js";
import { registerHealthRoutes } from "./routes/health.js";
import { registerOperationsRoutes } from "./routes/operations.js";
import { registerSubmissionSummaryRoutes } from "./routes/submissionSummaries.js";
import { registerSupportingDocumentRoutes } from "./routes/supportingDocuments.js";

import type { AppConfig } from "./config.js";
import type { DatabaseClient } from "./database/client.js";

export interface BuildAppOptions {
  config?: AppConfig;
  database?: DatabaseClient;
}

export async function buildApp(options: BuildAppOptions = {}) {
  const config = options.config ?? loadConfig();
  const app = Fastify({
    logger: createLoggerOptions(config)
  });

  await app.register(cors, {
    origin: config.CORS_ALLOWED_ORIGINS.length > 0 ? config.CORS_ALLOWED_ORIGINS : false
  });
  await registerObservability(app);
  await registerHardening(app, config);

  const database = options.database ?? createDatabaseClient(config);

  app.addHook("onClose", async () => {
    await database.close();
  });

  await registerHealthRoutes(app, config, database);
  await registerDebugRoutes(app, config);
  await registerGraphqlRoute(app, database.queryable);
  await registerOperationsRoutes(app, database.queryable, config, database);
  await registerSubmissionSummaryRoutes(app, database.queryable);
  await registerSupportingDocumentRoutes(app, database.queryable);

  return app;
}
