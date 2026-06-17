import { describe, expect, it } from "vitest";

import { buildApp } from "../app.js";
import { loadConfig } from "../config.js";

import type { DatabaseClient } from "../database/client.js";
import type { QueryResult, QueryResultRow } from "pg";

function createOperationsTestDatabase(options: {
  appliedMigrations?: QueryResultRow[];
  featureFlags?: QueryResultRow[];
  outboxRows?: QueryResultRow[];
  ping?: boolean;
} = {}): DatabaseClient {
  const outboxRows = options.outboxRows ?? [
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
  ];

  return {
    queryable: {
      async query<T extends QueryResultRow = QueryResultRow>(sql: string): Promise<QueryResult<T>> {
        const normalizedSql = sql.replace(/\s+/g, " ").trim();

        if (normalizedSql.includes("FROM outbox_events")) {
          return result<T>(outboxRows as unknown as T[]);
        }

        if (normalizedSql.includes("FROM feature_flags")) {
          return result<T>((options.featureFlags ?? [
            {
              id: "50000000-0000-4000-8000-000000000001",
              flag_key: "transaction.seniors-card.enabled",
              description: "Controls access to the Seniors Card prototype transaction.",
              enabled: true,
              metadata: {}
            },
            {
              id: "50000000-0000-4000-8000-000000000002",
              flag_key: "transaction.rental-security-subsidy.enabled",
              description: "Controls access to the Rental Security Subsidy prototype transaction.",
              enabled: false,
              metadata: {}
            }
          ]) as unknown as T[]);
        }

        if (normalizedSql.includes("FROM schema_migrations")) {
          return result<T>((options.appliedMigrations ?? [
            {
              version: "009_service_request_queue_assignment.sql"
            }
          ]) as unknown as T[]);
        }

        return result<T>([]);
      }
    },
    async ping() {
      return options.ping ?? true;
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
      headers: {
        "x-ssq-demo-role": "Admin",
        "x-ssq-demo-subject": "admin@example.test"
      },
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

  it("blocks citizen access to operations outbox counts", async () => {
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

    expect(response.statusCode).toBe(403);
    expect(response.json()).toMatchObject({
      ok: false,
      error: {
        code: "FORBIDDEN"
      }
    });

    await app.close();
  });

  it("returns admin operations posture with derived next actions", async () => {
    const app = await buildApp({
      config: loadConfig({
        NODE_ENV: "test",
        PORT: "7001",
        DEBUG_ROUTES_ENABLED: "true"
      }),
      database: createOperationsTestDatabase()
    });

    const response = await app.inject({
      headers: {
        "x-ssq-demo-role": "Admin",
        "x-ssq-demo-subject": "admin@example.test"
      },
      method: "GET",
      url: "/operations/posture"
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      ok: true,
      posture: {
        status: "DEGRADED",
        service: {
          name: "ssq-node-api",
          version: "0.0.0",
          environment: "test"
        },
        signals: {
          runtime: {
            status: "OK"
          },
          database: {
            status: "OK"
          },
          outbox: {
            status: "FAIL",
            summary: {
              totals: {
                pending: 2,
                processed: 1,
                failed: 1
              }
            }
          },
          featureFlags: {
            status: "WARN",
            enabled: 1,
            disabled: 1,
            flags: [
              {
                key: "transaction.seniors-card.enabled",
                enabled: true
              },
              {
                key: "transaction.rental-security-subsidy.enabled",
                enabled: false
              }
            ]
          },
          migrations: {
            status: "OK",
            latestApplied: "009_service_request_queue_assignment.sql",
            appliedCount: 1,
            availableCount: expect.any(Number)
          },
          hardening: {
            status: "WARN",
            debugRoutesEnabled: true,
            rateLimitEnabled: true
          },
          seededData: {
            status: "OK",
            latestAvailableSeed: expect.any(String),
            seedFileCount: expect.any(Number)
          }
        },
        nextActions: expect.arrayContaining([
          expect.objectContaining({
            code: "OUTBOX_FAILED",
            severity: "CRITICAL"
          }),
          expect.objectContaining({
            code: "OUTBOX_PENDING",
            severity: "WARN"
          }),
          expect.objectContaining({
            code: "FEATURES_DISABLED",
            severity: "WARN"
          }),
          expect.objectContaining({
            code: "DEBUG_ROUTES_ENABLED",
            severity: "WARN"
          })
        ])
      }
    });
    expect(response.json().posture.generatedAt).toEqual(expect.any(String));

    await app.close();
  });

  it("returns degraded posture instead of crashing when the database is down", async () => {
    const app = await buildApp({
      config: loadConfig({
        NODE_ENV: "test",
        PORT: "7001"
      }),
      database: createOperationsTestDatabase({
        ping: false
      })
    });

    const response = await app.inject({
      headers: {
        "x-ssq-demo-role": "Admin"
      },
      method: "GET",
      url: "/operations/posture"
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      ok: true,
      posture: {
        status: "DOWN",
        signals: {
          database: {
            status: "FAIL"
          },
          outbox: {
            status: "FAIL",
            error: "Database readiness check failed."
          },
          featureFlags: {
            status: "FAIL",
            error: "Database readiness check failed."
          },
          migrations: {
            status: "WARN"
          }
        },
        nextActions: expect.arrayContaining([
          expect.objectContaining({
            code: "DATABASE_DOWN",
            severity: "CRITICAL"
          })
        ])
      }
    });

    await app.close();
  });

  it("blocks citizen access to operations posture", async () => {
    const app = await buildApp({
      config: loadConfig({
        NODE_ENV: "test",
        PORT: "7001"
      }),
      database: createOperationsTestDatabase()
    });

    const response = await app.inject({
      method: "GET",
      url: "/operations/posture"
    });

    expect(response.statusCode).toBe(403);
    expect(response.json()).toMatchObject({
      ok: false,
      error: {
        code: "FORBIDDEN"
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
