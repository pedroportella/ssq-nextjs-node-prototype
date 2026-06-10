import cors from "@fastify/cors";
import Fastify from "fastify";

import { loadConfig } from "./config.js";
import { createDatabaseClient } from "./database/client.js";
import { createLoggerOptions } from "./logger.js";
import { registerGraphqlRoute } from "./routes/graphql.js";
import { registerHealthRoutes } from "./routes/health.js";
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
    origin: false
  });

  const database = options.database ?? createDatabaseClient(config);

  app.addHook("onClose", async () => {
    await database.close();
  });

  await registerHealthRoutes(app, config, database);
  await registerGraphqlRoute(app, database.queryable);
  await registerSupportingDocumentRoutes(app, database.queryable);

  return app;
}
