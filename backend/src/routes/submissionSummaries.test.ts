import { describe, expect, it } from "vitest";

import { buildApp } from "../app.js";
import { loadConfig } from "../config.js";

import type { DatabaseClient } from "../database/client.js";
import type { QueryResult, QueryResultRow } from "pg";

function createSummaryDownloadTestDatabase(): DatabaseClient {
  return {
    queryable: {
      async query<T extends QueryResultRow = QueryResultRow>(sql: string, values: readonly unknown[] = []): Promise<QueryResult<T>> {
        const normalizedSql = sql.replace(/\s+/g, " ").trim();

        if (normalizedSql.includes("FROM customers")) {
          return result<T>([
            {
              id: values[0] === "other.customer@example.test"
                ? "10000000-0000-4000-8000-000000000999"
                : "10000000-0000-4000-8000-000000000001",
              external_ref: "MYQLD-DEMO-001",
              email: String(values[0]),
              given_name: "Taylor",
              family_name: "Queensland"
            } as unknown as T
          ]);
        }

        if (normalizedSql.includes("FROM submission_summaries ss")) {
          if (values[0] !== "10000000-0000-4000-8000-000000000001" || values[1] !== "SSQ-DEMO-0001") {
            return result<T>([]);
          }

          return result<T>([
            {
              id: "91000000-0000-4000-8000-000000000001",
              service_request_id: "30000000-0000-4000-8000-000000000001",
              summary_format: "TEXT",
              content_type: "text/plain; charset=utf-8",
              file_name: "SSQ-DEMO-0001-summary.txt",
              summary_payload: {
                referenceNumber: "SSQ-DEMO-0001"
              },
              summary_text: "Reference: SSQ-DEMO-0001",
              created_at: "2026-06-10T00:00:00.000Z",
              updated_at: "2026-06-10T00:00:00.000Z"
            } as unknown as T
          ]);
        }

        return result<T>([]);
      }
    },
    async ping() {
      return true;
    },
    async close() {
      return;
    }
  };
}

describe("submission summary download route", () => {
  it("downloads a customer-owned submission summary with content disposition", async () => {
    const app = await buildApp({
      config: loadConfig({
        NODE_ENV: "test",
        PORT: "7001"
      }),
      database: createSummaryDownloadTestDatabase()
    });

    const response = await app.inject({
      method: "GET",
      url: "/service-requests/SSQ-DEMO-0001/summary/download"
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers["content-type"]).toContain("text/plain");
    expect(response.headers["content-disposition"]).toBe('attachment; filename="SSQ-DEMO-0001-summary.txt"');
    expect(response.body).toBe("Reference: SSQ-DEMO-0001");

    await app.close();
  });

  it("does not download another customer's submission summary", async () => {
    const app = await buildApp({
      config: loadConfig({
        NODE_ENV: "test",
        PORT: "7001"
      }),
      database: createSummaryDownloadTestDatabase()
    });

    const response = await app.inject({
      headers: {
        "x-demo-customer-email": "other.customer@example.test"
      },
      method: "GET",
      url: "/service-requests/SSQ-DEMO-0001/summary/download"
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toMatchObject({
      ok: false,
      error: {
        code: "SUMMARY_NOT_FOUND"
      }
    });

    await app.close();
  });
});

function result<T extends QueryResultRow>(rows: T[]): QueryResult<T> {
  return {
    command: "SELECT",
    fields: [],
    oid: 0,
    rowCount: rows.length,
    rows
  };
}
