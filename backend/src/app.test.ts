import { describe, expect, it } from "vitest";

import { buildApp } from "./app.js";
import { loadConfig } from "./config.js";

import type { DatabaseClient } from "./database/client.js";

function createTestDatabase(pingResult: boolean): DatabaseClient {
  return {
    queryable: {
      async query() {
        return {
          command: "SELECT",
          fields: [],
          oid: 0,
          rowCount: 0,
          rows: []
        };
      }
    },
    async ping() {
      return pingResult;
    },
    async close() {
      return;
    }
  };
}

describe("backend health service", () => {
  it("boots the app in test mode", async () => {
    const app = await buildApp({
      config: loadConfig({
        NODE_ENV: "test",
        PORT: "7001"
      })
    });

    await app.ready();
    await app.close();
  });

  it("returns health status", async () => {
    const app = await buildApp({
      config: loadConfig({
        APP_NAME: "ssq-node-api",
        APP_VERSION: "0.0.0",
        NODE_ENV: "test",
        PORT: "7001"
      })
    });

    const response = await app.inject({
      method: "GET",
      url: "/health"
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers["x-correlation-id"]).toEqual(expect.any(String));
    expect(response.json()).toEqual({
      status: "UP",
      service: "ssq-node-api",
      version: "0.0.0",
      environment: "test",
      checks: {
        runtime: "UP"
      }
    });

    await app.close();
  });

  it("applies security headers", async () => {
    const app = await buildApp({
      config: loadConfig({
        NODE_ENV: "test",
        PORT: "7001"
      })
    });

    const response = await app.inject({
      method: "GET",
      url: "/health/live"
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers["x-content-type-options"]).toBe("nosniff");
    expect(response.headers["x-frame-options"]).toBe("DENY");
    expect(response.headers["referrer-policy"]).toBe("no-referrer");
    expect(response.headers["permissions-policy"]).toContain("geolocation=()");

    await app.close();
  });

  it("allows only configured CORS origins", async () => {
    const app = await buildApp({
      config: loadConfig({
        CORS_ALLOWED_ORIGINS: "https://allowed.example.test",
        NODE_ENV: "test",
        PORT: "7001"
      })
    });

    const allowed = await app.inject({
      headers: {
        origin: "https://allowed.example.test"
      },
      method: "GET",
      url: "/health/live"
    });
    const blocked = await app.inject({
      headers: {
        origin: "https://blocked.example.test"
      },
      method: "GET",
      url: "/health/live"
    });

    expect(allowed.headers["access-control-allow-origin"]).toBe("https://allowed.example.test");
    expect(blocked.headers["access-control-allow-origin"]).toBeUndefined();

    await app.close();
  });

  it("rate limits requests with safe errors", async () => {
    const app = await buildApp({
      config: loadConfig({
        NODE_ENV: "test",
        PORT: "7001",
        RATE_LIMIT_MAX: "1",
        RATE_LIMIT_WINDOW_MS: "60000"
      })
    });

    const first = await app.inject({
      method: "GET",
      url: "/health/live"
    });
    const limited = await app.inject({
      headers: {
        "x-correlation-id": "rate-limit-correlation"
      },
      method: "GET",
      url: "/health/live"
    });

    expect(first.statusCode).toBe(200);
    expect(limited.statusCode).toBe(429);
    expect(limited.headers["x-ratelimit-limit"]).toBe("1");
    expect(limited.json()).toEqual({
      ok: false,
      error: {
        code: "RATE_LIMITED",
        message: "Too many requests.",
        correlationId: "rate-limit-correlation"
      }
    });

    await app.close();
  });

  it("preserves supplied correlation IDs on responses", async () => {
    const app = await buildApp({
      config: loadConfig({
        NODE_ENV: "test",
        PORT: "7001"
      })
    });

    const response = await app.inject({
      headers: {
        "x-correlation-id": "supplied-correlation"
      },
      method: "GET",
      url: "/health/live"
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers["x-correlation-id"]).toBe("supplied-correlation");

    await app.close();
  });

  it("returns safe not-found errors with correlation IDs", async () => {
    const app = await buildApp({
      config: loadConfig({
        NODE_ENV: "test",
        PORT: "7001"
      })
    });

    const response = await app.inject({
      headers: {
        "x-correlation-id": "missing-route-correlation"
      },
      method: "GET",
      url: "/missing-route"
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({
      ok: false,
      error: {
        code: "NOT_FOUND",
        message: "Route was not found.",
        correlationId: "missing-route-correlation"
      }
    });

    await app.close();
  });

  it("keeps debug routes unavailable unless explicitly enabled outside production", async () => {
    const disabledApp = await buildApp({
      config: loadConfig({
        NODE_ENV: "test",
        PORT: "7001"
      })
    });

    const disabledResponse = await disabledApp.inject({
      method: "GET",
      url: "/debug/request"
    });

    expect(disabledResponse.statusCode).toBe(404);
    await disabledApp.close();

    const enabledApp = await buildApp({
      config: loadConfig({
        DEBUG_ROUTES_ENABLED: "true",
        NODE_ENV: "test",
        PORT: "7001"
      })
    });

    const enabledResponse = await enabledApp.inject({
      headers: {
        "x-correlation-id": "debug-correlation"
      },
      method: "GET",
      url: "/debug/request"
    });

    expect(enabledResponse.statusCode).toBe(200);
    expect(enabledResponse.json()).toMatchObject({
      ok: true,
      correlationId: "debug-correlation",
      method: "GET",
      url: "/debug/request"
    });

    await enabledApp.close();
  });

  it("returns liveness and readiness probes", async () => {
    const app = await buildApp({
      config: loadConfig({
        NODE_ENV: "test",
        PORT: "7001"
      }),
      database: createTestDatabase(true)
    });

    const live = await app.inject({
      method: "GET",
      url: "/health/live"
    });
    const ready = await app.inject({
      method: "GET",
      url: "/health/ready"
    });

    expect(live.statusCode).toBe(200);
    expect(live.json()).toMatchObject({
      status: "UP",
      checks: {
        runtime: "UP"
      }
    });
    expect(ready.statusCode).toBe(200);
    expect(ready.json()).toMatchObject({
      status: "UP",
      checks: {
        runtime: "UP",
        database: "UP"
      }
    });

    await app.close();
  });

  it("returns unavailable readiness when the database cannot be reached", async () => {
    const app = await buildApp({
      config: loadConfig({
        NODE_ENV: "test",
        PORT: "7001"
      }),
      database: createTestDatabase(false)
    });

    const ready = await app.inject({
      method: "GET",
      url: "/health/ready"
    });

    expect(ready.statusCode).toBe(503);
    expect(ready.json()).toMatchObject({
      status: "DOWN",
      checks: {
        runtime: "UP",
        database: "DOWN"
      }
    });

    await app.close();
  });

  it("fails safely when config is invalid", () => {
    expect(() =>
      loadConfig({
        NODE_ENV: "test",
        PORT: "not-a-port"
      })
    ).toThrow();
  });
});
