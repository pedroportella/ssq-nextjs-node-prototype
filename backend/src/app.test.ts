import { describe, expect, it } from "vitest";

import { buildApp } from "./app.js";
import { loadConfig } from "./config.js";

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

  it("returns liveness and readiness probes", async () => {
    const app = await buildApp({
      config: loadConfig({
        NODE_ENV: "test",
        PORT: "7001"
      })
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
        runtime: "UP"
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
