import { describe, expect, it } from "vitest";

import { buildApp } from "../app.js";
import { loadConfig } from "../config.js";

import type { DatabaseClient } from "../database/client.js";
import type { QueryResult, QueryResultRow } from "pg";

function createGraphqlTestDatabase(): DatabaseClient {
  return {
    queryable: {
      async query<T extends QueryResultRow = QueryResultRow>(sql: string, values: readonly unknown[] = []): Promise<QueryResult<T>> {
        const normalizedSql = sql.replace(/\s+/g, " ").trim();

        if (normalizedSql.includes("FROM customers")) {
          if (values[0] === "missing@example.test") {
            return result<T>([]);
          }

          return result<T>([
            {
              id: "10000000-0000-4000-8000-000000000001",
              external_ref: "MYQLD-DEMO-001",
              email: String(values[0]),
              given_name: "Taylor",
              family_name: "Queensland"
            } as unknown as T
          ]);
        }

        if (normalizedSql.includes("FROM customer_profile_attributes")) {
          return result<T>([
            {
              id: "40000000-0000-4000-8000-000000000001",
              customer_id: values[0],
              attribute_key: "residency",
              attribute_value: {
                state: "QLD",
                verified: true
              }
            } as unknown as T
          ]);
        }

        if (normalizedSql.includes("FROM feature_flags")) {
          return result<T>([
            {
              id: "50000000-0000-4000-8000-000000000001",
              flag_key: "transaction.seniors-card.enabled",
              description: "Controls access to the Seniors Card prototype transaction.",
              enabled: true,
              metadata: {
                surface: "seniors-card"
              }
            } as unknown as T
          ]);
        }

        if (normalizedSql.includes("FROM transaction_definitions td")) {
          const rows = catalogueRows();

          if (normalizedSql.includes("WHERE td.transaction_key = $1")) {
            return result<T>(rows.filter((row) => row.transaction_key === values[0]) as T[]);
          }

          return result<T>(rows as T[]);
        }

        if (normalizedSql.includes("FROM transaction_definitions")) {
          return result<T>(
            catalogueRows().map((row) => ({
              id: row.id,
              transaction_key: row.transaction_key,
              label: row.label,
              description: row.description,
              status: row.status,
              owning_agency: row.owning_agency
            })) as unknown as T[]
          );
        }

        if (normalizedSql.includes("FROM service_requests sr")) {
          return result<T>([
            {
              id: "30000000-0000-4000-8000-000000000001",
              customer_id: values[0] === "SSQ-DEMO-0001" ? "10000000-0000-4000-8000-000000000001" : values[0],
              transaction_definition_id: "20000000-0000-4000-8000-000000000002",
              transaction_key: "seniors-card",
              reference_number: "SSQ-DEMO-0001",
              status: "SUBMITTED",
              payload: {
                prototype: true
              }
            } as unknown as T
          ]);
        }

        if (normalizedSql.includes("FROM service_request_events")) {
          return result<T>([
            {
              id: "60000000-0000-4000-8000-000000000001",
              service_request_id: values[0],
              event_type: "SERVICE_REQUEST_SEEDED",
              event_payload: {
                source: "test"
              },
              created_at: "2026-06-10T00:00:00.000Z"
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

describe("GraphQL route", () => {
  it("boots the schema and returns seeded profile and catalogue data", async () => {
    const app = await buildApp({
      config: loadConfig({
        NODE_ENV: "test",
        PORT: "7001"
      }),
      database: createGraphqlTestDatabase()
    });

    const response = await app.inject({
      headers: {
        "content-type": "application/json",
        "x-correlation-id": "test-correlation-id"
      },
      method: "POST",
      payload: {
        query: `
          query PlatformData {
            platform { correlationId }
            viewer { email givenName externalRef }
            customerProfile {
              attributes { key value }
              serviceRequests { referenceNumber transactionKey status }
            }
            featureFlags { key enabled }
            transactionCatalogue {
              definition { key label }
              schemaVersion
              featureEnabled
            }
            transactionSchema(transactionKey: "seniors-card") {
              transactionKey
              schemaVersion
              schema
            }
          }
        `
      },
      url: "/graphql"
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      data: {
        platform: {
          correlationId: "test-correlation-id"
        },
        viewer: {
          email: "demo.customer@example.test",
          givenName: "Taylor",
          externalRef: "MYQLD-DEMO-001"
        },
        customerProfile: {
          attributes: [
            {
              key: "residency",
              value: {
                state: "QLD",
                verified: true
              }
            }
          ],
          serviceRequests: [
            {
              referenceNumber: "SSQ-DEMO-0001",
              transactionKey: "seniors-card",
              status: "SUBMITTED"
            }
          ]
        },
        featureFlags: [
          {
            key: "transaction.seniors-card.enabled",
            enabled: true
          }
        ],
        transactionCatalogue: [
          {
            definition: {
              key: "seniors-card",
              label: "Seniors Card"
            },
            schemaVersion: "2026-06-10",
            featureEnabled: true
          }
        ],
        transactionSchema: {
          transactionKey: "seniors-card",
          schemaVersion: "2026-06-10",
          schema: {
            title: "Seniors Card"
          }
        }
      }
    });

    await app.close();
  });

  it("returns safe nulls for a missing demo identity", async () => {
    const app = await buildApp({
      config: loadConfig({
        NODE_ENV: "test",
        PORT: "7001"
      }),
      database: createGraphqlTestDatabase()
    });

    const response = await app.inject({
      headers: {
        "content-type": "application/json",
        "x-demo-customer-email": "missing@example.test"
      },
      method: "POST",
      payload: {
        query: `
          query MissingIdentity {
            viewer { email }
            customerProfile { customer { email } }
            serviceRequests { referenceNumber }
          }
        `
      },
      url: "/graphql"
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      data: {
        viewer: null,
        customerProfile: null,
        serviceRequests: []
      }
    });

    await app.close();
  });
});

function catalogueRows(): QueryResultRow[] {
  return [
    {
      id: "20000000-0000-4000-8000-000000000002",
      transaction_key: "seniors-card",
      label: "Seniors Card",
      description: "Prototype Seniors Card transaction for eligibility and application flow.",
      status: "ENABLED",
      owning_agency: "Smart Service Queensland",
      schema_version: "2026-06-10",
      schema_json: {
        title: "Seniors Card"
      },
      feature_flag_key: "transaction.seniors-card.enabled",
      feature_enabled: true
    }
  ];
}

function result<T extends QueryResultRow>(rows: T[]): QueryResult<T> {
  return {
    command: "SELECT",
    fields: [],
    oid: 0,
    rowCount: rows.length,
    rows
  };
}
