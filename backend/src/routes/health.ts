import type { FastifyInstance } from "fastify";
import type { AppConfig } from "../config.js";

interface HealthResponse {
  status: "UP";
  service: string;
  version: string;
  environment: AppConfig["NODE_ENV"];
  checks: {
    runtime: "UP";
  };
}

function healthResponse(config: AppConfig): HealthResponse {
  return {
    status: "UP",
    service: config.APP_NAME,
    version: config.APP_VERSION,
    environment: config.NODE_ENV,
    checks: {
      runtime: "UP"
    }
  };
}

export async function registerHealthRoutes(app: FastifyInstance, config: AppConfig) {
  app.get("/health", async () => healthResponse(config));

  app.get("/health/live", async () => ({
    status: "UP",
    checks: {
      runtime: "UP"
    }
  }));

  app.get("/health/ready", async () => healthResponse(config));
}
