import cors from "@fastify/cors";
import Fastify from "fastify";

import { loadConfig } from "./config.js";
import { createLoggerOptions } from "./logger.js";
import { registerHealthRoutes } from "./routes/health.js";

import type { AppConfig } from "./config.js";

export interface BuildAppOptions {
  config?: AppConfig;
}

export async function buildApp(options: BuildAppOptions = {}) {
  const config = options.config ?? loadConfig();
  const app = Fastify({
    logger: createLoggerOptions(config)
  });

  await app.register(cors, {
    origin: false
  });

  await registerHealthRoutes(app, config);

  return app;
}
