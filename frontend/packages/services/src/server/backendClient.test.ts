import { describe, expect, it, vi } from "vitest";

import {
  BackendClientError,
  CORRELATION_HEADER,
  createBackendHeaders,
  executeBackendGraphql,
  loadBackendClientConfig
} from "./index";

describe("server backend client", () => {
  it("loads server-only backend configuration", () => {
    expect(loadBackendClientConfig({ BACKEND_INTERNAL_URL: "http://backend:7001/" })).toEqual({
      backendUrl: "http://backend:7001"
    });
  });

  it("fails safely when backend URL is missing", () => {
    expect(() => loadBackendClientConfig({})).toThrow(BackendClientError);
  });

  it("adds a correlation header", () => {
    const headers = createBackendHeaders("test-correlation-id");

    expect(headers.get(CORRELATION_HEADER)).toBe("test-correlation-id");
  });

  it("posts GraphQL requests to the backend", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () =>
      Response.json({
        data: {
          viewer: {
            id: "demo"
          }
        }
      })
    );

    const response = await executeBackendGraphql<{ viewer: { id: string } }>(
      {
        query: "query Viewer { viewer { id } }"
      },
      {
        config: {
          backendUrl: "http://backend:7001"
        },
        fetchImpl
      }
    );

    expect(response.data?.viewer.id).toBe("demo");
    expect(response.correlationId).toHaveLength(36);
    expect(fetchImpl).toHaveBeenCalledWith(
      "http://backend:7001/graphql",
      expect.objectContaining({
        cache: "no-store",
        method: "POST"
      })
    );
  });
});
