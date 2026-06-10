import { describe, expect, it } from "vitest";

import { buildApp } from "../app.js";
import { loadConfig } from "../config.js";

import type { DatabaseClient } from "../database/client.js";
import type { QueryResult, QueryResultRow } from "pg";

function createOperationsTestDatabase(): DatabaseClient {
  return {
    queryable: {
      async query<T extends QueryResultRow = QueryResultRow>(sql: string): Promise<QueryResult<T>> {
        const normalizedSql = sql.replace(/\s+/g, " ").trim();

        if (normalizedSql.includes("FROM outbox_events")) {
          return result<T>([
            {
              event_type: "AgencyReviewRequested",
              status: "PENDING",
              event_count: "2"
            },
            {
              event_type: "NotificationRequested",
              status: "PROCESSED",
              event_count: "1"
            },
            {
              event_type: "ServiceRequestSubmitted",
              status: "FAILED",
              event_count: "1"
            }
          ] as unknown as T[]);
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

describe("operations routes", () => {
  it("summarises outbox event counts", async () => {
    const app = await buildApp({
      config: loadConfig({
        NODE_ENV: "test",
        PORT: "7001"
      }),
      database: createOperationsTestDatabase()
    });

    const response = await app.inject({
      method: "GET",
      url: "/operations/outbox-events"
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      ok: true,
      outbox: {
        totals: {
          pending: 2,
          processed: 1,
          failed: 1
        },
        byEventType: [
          {
            eventType: "AgencyReviewRequested",
            pending: 2,
            total: 2
          },
          {
            eventType: "NotificationRequested",
            processed: 1,
            total: 1
          },
          {
            eventType: "ServiceRequestSubmitted",
            failed: 1,
            total: 1
          }
        ]
      }
    });
    expect(response.json().generatedAt).toEqual(expect.any(String));

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
