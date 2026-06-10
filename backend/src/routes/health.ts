import type { FastifyInstance } from "fastify";
import type { AppConfig } from "../config.js";
import type { DatabaseHealthCheck } from "../database/types.js";

interface HealthResponse {
  status: "UP" | "DOWN";
  service: string;
  version: string;
  environment: AppConfig["NODE_ENV"];
  checks: {
    runtime: "UP";
    database?: "UP" | "DOWN";
  };
}

async function healthResponse(config: AppConfig, database?: DatabaseHealthCheck): Promise<HealthResponse> {
  const databaseIsReady = database ? await database.ping() : undefined;

  return {
    status: databaseIsReady === false ? "DOWN" : "UP",
    service: config.APP_NAME,
    version: config.APP_VERSION,
    environment: config.NODE_ENV,
    checks: {
      runtime: "UP",
      ...(databaseIsReady === undefined ? {} : { database: databaseIsReady ? "UP" : "DOWN" })
    }
  };
}

export async function registerHealthRoutes(app: FastifyInstance, config: AppConfig, database?: DatabaseHealthCheck) {
  app.get("/health", async () => healthResponse(config));

  app.get("/health/live", async () => ({
    status: "UP",
    checks: {
      runtime: "UP"
    }
  }));

  app.get("/health/ready", async (_request, reply) => {
    const response = await healthResponse(config, database);

    if (response.status === "DOWN") {
      reply.code(503);
    }

    return response;
  });
}
