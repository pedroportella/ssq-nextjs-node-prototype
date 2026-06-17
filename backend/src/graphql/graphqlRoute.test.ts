import { describe, expect, it } from "vitest";

import { buildApp } from "../app.js";
import { loadConfig } from "../config.js";

import type { DatabaseClient } from "../database/client.js";
import type { QueryResult, QueryResultRow } from "pg";

function createGraphqlTestDatabase(): DatabaseClient {
  const customerProfileEvidence: QueryResultRow[] = [];
  const outboxEvents: QueryResultRow[] = [];
  const serviceRequestEvents: QueryResultRow[] = [];
  const serviceRequests: QueryResultRow[] = [];
  const serviceRequestDrafts: QueryResultRow[] = [];
  const submissionSummaries: QueryResultRow[] = [];
  const supportingDocuments: QueryResultRow[] = [
    {
      id: "93000000-0000-4000-8000-000000000001",
      customer_id: "10000000-0000-4000-8000-000000000001",
      service_request_draft_id: null,
      service_request_id: "30000000-0000-4000-8000-000000000001",
      category: "identity",
      file_name: "identity-evidence.pdf",
      file_extension: ".pdf",
      mime_type: "application/pdf",
      size_bytes: 512000,
      storage_key: "supporting-documents/identity-evidence.pdf",
      upload_status: "UPLOADED",
      scan_status: "PASSED",
      retention_policy: "prototype",
      metadata: {},
      created_at: "2026-06-10T00:35:00.000Z",
      updated_at: "2026-06-10T00:35:00.000Z"
    }
  ];

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

        if (normalizedSql.includes("FROM customer_profile_attributes")) {
          const rows = [
            {
              id: "40000000-0000-4000-8000-000000000001",
              customer_id: values[0],
              attribute_key: "residency",
              attribute_value: {
                state: "QLD",
                verified: true
              }
            },
            {
              id: "40000000-0000-4000-8000-000000000002",
              customer_id: values[0],
              attribute_key: "preferred_contact",
              attribute_value: {
                channel: "email",
                verified: false
              }
            }
          ];

          if (normalizedSql.includes("attribute_key = ANY")) {
            return result<T>(rows.filter((row) => (values[1] as string[]).includes(row.attribute_key)) as unknown as T[]);
          }

          return result<T>(rows as unknown as T[]);
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

        if (!normalizedSql.startsWith("UPDATE service_requests sr") && normalizedSql.includes("FROM transaction_definitions td")) {
          const rows = catalogueRows();

          if (normalizedSql.includes("WHERE td.transaction_key = $1")) {
            return result<T>(rows.filter((row) => row.transaction_key === values[0]) as T[]);
          }

          return result<T>(rows as unknown as T[]);
        }

        if (normalizedSql.startsWith("INSERT INTO service_request_drafts")) {
          const row = {
            id: "70000000-0000-4000-8000-000000000001",
            customer_id: String(values[0]),
            transaction_definition_id: String(values[1]),
            current_step: String(values[2]),
            payload: JSON.parse(String(values[3])),
            created_at: "2026-06-10T00:00:00.000Z",
            updated_at: "2026-06-10T00:00:00.000Z"
          };

          serviceRequestDrafts.push(row);
          return result<T>([row as unknown as T]);
        }

        if (normalizedSql.startsWith("INSERT INTO service_requests")) {
          const row = {
            id: "30000000-0000-4000-8000-000000000099",
            customer_id: String(values[0]),
            transaction_definition_id: String(values[1]),
            reference_number: String(values[2]),
            status: String(values[3]),
            payload: JSON.parse(String(values[4])),
            assigned_officer_subject: null,
            assigned_team: null,
            last_touched_by: null,
            last_touched_at: null,
            created_at: "2026-06-10T00:00:00.000Z",
            updated_at: "2026-06-10T00:00:00.000Z"
          };

          serviceRequests.push(row);
          return result<T>([row as unknown as T]);
        }

        if (normalizedSql.startsWith("INSERT INTO service_request_events")) {
          const row = {
            id: "60000000-0000-4000-8000-000000000099",
            service_request_id: String(values[0]),
            event_type: String(values[1]),
            event_payload: JSON.parse(String(values[2])),
            created_at: "2026-06-10T00:10:00.000Z"
          };

          serviceRequestEvents.push(row);
          return result<T>([row as unknown as T]);
        }

        if (normalizedSql.startsWith("INSERT INTO outbox_events")) {
          const row = {
            id: `92000000-0000-4000-8000-00000000000${outboxEvents.length + 1}`,
            event_type: String(values[0]),
            aggregate_type: String(values[1]),
            aggregate_id: String(values[2]),
            event_payload: JSON.parse(String(values[3])),
            status: "PENDING",
            available_at: "2026-06-10T00:25:00.000Z",
            processed_at: null,
            created_at: "2026-06-10T00:25:00.000Z",
            updated_at: "2026-06-10T00:25:00.000Z"
          };

          outboxEvents.push(row);
          return result<T>([row as unknown as T]);
        }

        if (normalizedSql.startsWith("INSERT INTO submission_summaries")) {
          const row = {
            id: "91000000-0000-4000-8000-000000000001",
            service_request_id: String(values[0]),
            summary_format: String(values[1]),
            content_type: String(values[2]),
            file_name: String(values[3]),
            summary_payload: JSON.parse(String(values[4])),
            summary_text: String(values[5]),
            created_at: "2026-06-10T00:20:00.000Z",
            updated_at: "2026-06-10T00:20:00.000Z"
          };

          submissionSummaries.push(row);
          return result<T>([row as unknown as T]);
        }

        if (normalizedSql.startsWith("INSERT INTO customer_profile_evidence")) {
          const row = {
            id: `80000000-0000-4000-8000-00000000000${customerProfileEvidence.length + 1}`,
            service_request_id: String(values[0]),
            customer_profile_attribute_id: values[1] === null ? null : String(values[1]),
            attribute_key: String(values[2]),
            attribute_value: JSON.parse(String(values[3])),
            evidence_source: "SIMULATED_PROFILE",
            verification_status: String(values[4]),
            evidence_metadata: JSON.parse(String(values[5])),
            created_at: "2026-06-10T00:15:00.000Z"
          };

          customerProfileEvidence.push(row);
          return result<T>([row as unknown as T]);
        }

        if (normalizedSql.startsWith("UPDATE service_request_drafts")) {
          const draft = serviceRequestDrafts.find((row) => row.id === values[0] && row.customer_id === values[1]);

          if (!draft) {
            return result<T>([]);
          }

          draft.current_step = String(values[2]);
          draft.payload = JSON.parse(String(values[3]));
          draft.updated_at = "2026-06-10T00:05:00.000Z";

          return result<T>([draft as unknown as T]);
        }

        if (normalizedSql.startsWith("UPDATE service_requests sr")) {
          if (normalizedSql.includes("assigned_officer_subject = $2")) {
            const submitted = serviceRequests.find((row) => row.reference_number === values[0] && row.status !== "DRAFT");

            if (submitted) {
              submitted.assigned_officer_subject = values[1] === null ? null : String(values[1]);
              submitted.assigned_team = values[2] === null ? null : String(values[2]);
              submitted.last_touched_by = String(values[3]);
              submitted.last_touched_at = "2026-06-10T00:35:00.000Z";

              return result<T>([
                {
                  ...submitted,
                  transaction_key: "seniors-card"
                } as unknown as T
              ]);
            }

            if (values[0] === "SSQ-DEMO-0001") {
              return result<T>([
                {
                  id: "30000000-0000-4000-8000-000000000001",
                  customer_id: "10000000-0000-4000-8000-000000000001",
                  transaction_definition_id: "20000000-0000-4000-8000-000000000002",
                  transaction_key: "seniors-card",
                  reference_number: values[0],
                  status: "SUBMITTED",
                  payload: {
                    prototype: true
                  },
                  assigned_officer_subject: values[1] === null ? null : String(values[1]),
                  assigned_team: values[2] === null ? null : String(values[2]),
                  last_touched_by: String(values[3]),
                  last_touched_at: "2026-06-10T00:35:00.000Z",
                  created_at: "2026-06-10T00:00:00.000Z",
                  updated_at: "2026-06-10T00:35:00.000Z"
                } as unknown as T
              ]);
            }

            return result<T>([]);
          }

          const submitted = serviceRequests.find((row) => row.reference_number === values[0] && row.customer_id === values[1]);

          if (submitted) {
            submitted.status = String(values[2]);
            submitted.last_touched_by = values[3] === null ? submitted.last_touched_by : String(values[3]);
            submitted.last_touched_at = values[3] === null ? submitted.last_touched_at : "2026-06-10T00:30:00.000Z";

            return result<T>([
              {
                ...submitted,
                transaction_key: "seniors-card"
              } as unknown as T
            ]);
          }

          if (values[0] === "SSQ-DEMO-0001" && values[1] === "10000000-0000-4000-8000-000000000001") {
            return result<T>([
              {
                id: "30000000-0000-4000-8000-000000000001",
                customer_id: values[1],
                transaction_definition_id: "20000000-0000-4000-8000-000000000002",
                transaction_key: "seniors-card",
                reference_number: values[0],
                status: values[2],
                payload: {
                  prototype: true
                },
                assigned_officer_subject: null,
                assigned_team: null,
                last_touched_by: values[3] === null ? null : String(values[3]),
                last_touched_at: values[3] === null ? null : "2026-06-10T00:30:00.000Z",
                created_at: "2026-06-10T00:00:00.000Z",
                updated_at: "2026-06-10T00:30:00.000Z"
              } as unknown as T
            ]);
          }

          return result<T>([]);
        }

        if (normalizedSql.includes("FROM service_request_drafts srd")) {
          const rows = serviceRequestDrafts
            .filter((row) => normalizedSql.includes("WHERE srd.id = $1")
              ? row.id === values[0] && row.customer_id === values[1]
              : row.customer_id === values[0])
            .map((row) => ({
              ...row,
              transaction_key: "seniors-card"
            }));

          return result<T>(rows as unknown as T[]);
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
          const seededRows: QueryResultRow[] = [
            {
              id: "30000000-0000-4000-8000-000000000001",
              customer_id: "10000000-0000-4000-8000-000000000001",
              transaction_definition_id: "20000000-0000-4000-8000-000000000002",
              transaction_key: "seniors-card",
              reference_number: "SSQ-DEMO-0001",
              status: "SUBMITTED",
              payload: {
                prototype: true
              },
              assigned_officer_subject: null,
              assigned_team: null,
              last_touched_by: null,
              last_touched_at: null,
              created_at: "2026-06-10T00:00:00.000Z",
              updated_at: "2026-06-10T00:00:00.000Z"
            }
          ];
          const submittedRows: QueryResultRow[] = serviceRequests.map((row) => ({
            ...row,
            transaction_key: "seniors-card"
          }));
          const allRows = [...seededRows, ...submittedRows];

          if (normalizedSql.startsWith("SELECT count(*) AS total_count")) {
            const rows = filterServiceRequestRows(allRows, normalizedSql, values);

            return result<T>([
              {
                total_count: rows.length
              } as unknown as T
            ]);
          }

          if (normalizedSql.startsWith("SELECT sr.status, count(*) AS status_count")) {
            const counts = new Map<string, number>();

            for (const row of filterServiceRequestRows(allRows, normalizedSql, values)) {
              counts.set(String(row.status), (counts.get(String(row.status)) ?? 0) + 1);
            }

            return result<T>([...counts.entries()].map(([status, count]) => ({
              status,
              status_count: count
            })) as unknown as T[]);
          }

          if (normalizedSql.includes("LIMIT")) {
            const rows = filterServiceRequestRows(allRows, normalizedSql, values);
            const pageSize = Number(values.at(-2));
            const offset = Number(values.at(-1));

            return result<T>(rows.slice(offset, offset + pageSize) as unknown as T[]);
          }

          if (normalizedSql.includes("WHERE sr.reference_number = $1 AND sr.customer_id = $2")) {
            return result<T>(
              allRows.filter((row) => row.reference_number === values[0] && row.customer_id === values[1]) as unknown as T[]
            );
          }

          if (normalizedSql.includes("WHERE sr.reference_number = $1")) {
            return result<T>(
              allRows.filter((row) => row.reference_number === values[0]) as unknown as T[]
            );
          }

          if (normalizedSql.includes("WHERE sr.status <> 'DRAFT'")) {
            return result<T>(
              allRows.filter((row) => row.status !== "DRAFT") as unknown as T[]
            );
          }

          return result<T>(
            allRows.filter((row) => row.customer_id === values[0]) as unknown as T[]
          );
        }

        if (normalizedSql.includes("FROM service_request_events")) {
          const seededRows = [
            {
              id: "60000000-0000-4000-8000-000000000001",
              service_request_id: values[0],
              event_type: "SERVICE_REQUEST_SEEDED",
              event_payload: {
                source: "test"
              },
              created_at: "2026-06-10T00:00:00.000Z"
            }
          ];
          const rows = serviceRequestEvents.filter((row) => row.service_request_id === values[0]);

          return result<T>([...seededRows, ...rows] as unknown as T[]);
        }

        if (normalizedSql.includes("FROM customer_profile_evidence")) {
          return result<T>(customerProfileEvidence.filter((row) => row.service_request_id === values[0]) as unknown as T[]);
        }

        if (normalizedSql.includes("FROM supporting_documents")) {
          const targetColumn = normalizedSql.includes("service_request_id = $2")
            ? "service_request_id"
            : "service_request_draft_id";

          return result<T>(
            supportingDocuments.filter((row) => row.customer_id === values[0] && row[targetColumn] === values[1]) as unknown as T[]
          );
        }

        if (normalizedSql.includes("FROM submission_summaries ss")) {
          const serviceRequest = [...serviceRequests, {
            id: "30000000-0000-4000-8000-000000000001",
            customer_id: "10000000-0000-4000-8000-000000000001",
            reference_number: "SSQ-DEMO-0001"
          }].find((row) => row.customer_id === values[0] && row.reference_number === values[1]);
          const rows = serviceRequest
            ? submissionSummaries.filter((row) => row.service_request_id === serviceRequest.id)
            : [];

          return result<T>(rows as unknown as T[]);
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
            platform {
              correlationId
              identityAssuranceLevel
              identityDisplayName
              identitySource
            }
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
          correlationId: "test-correlation-id",
          identityAssuranceLevel: "DEMO_LOW_ASSURANCE",
          identityDisplayName: "demo.customer",
          identitySource: "DEMO_HEADER"
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
            },
            {
              key: "preferred_contact",
              value: {
                channel: "email",
                verified: false
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
            title: "Seniors Card",
            prefillProfileAttributes: ["residency", "preferred_contact"]
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

  it("does not let a citizen read another customer's service request by reference", async () => {
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
        "x-ssq-demo-subject": "other.customer@example.test"
      },
      method: "POST",
      payload: {
        query: `
          query OtherCustomerRequest {
            serviceRequest(referenceNumber: "SSQ-DEMO-0001") {
              referenceNumber
            }
          }
        `
      },
      url: "/graphql"
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      data: {
        serviceRequest: null
      }
    });

    await app.close();
  });

  it("returns supporting documents for a customer-owned service request", async () => {
    const app = await buildApp({
      config: loadConfig({
        NODE_ENV: "test",
        PORT: "7001"
      }),
      database: createGraphqlTestDatabase()
    });

    const response = await app.inject({
      headers: {
        "content-type": "application/json"
      },
      method: "POST",
      payload: {
        query: `
          query SupportingDocuments {
            supportingDocuments(referenceNumber: "SSQ-DEMO-0001") {
              category
              fileName
              mimeType
              sizeBytes
              uploadStatus
              scanStatus
            }
          }
        `
      },
      url: "/graphql"
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      data: {
        supportingDocuments: [
          {
            category: "identity",
            fileName: "identity-evidence.pdf",
            mimeType: "application/pdf",
            sizeBytes: 512000,
            uploadStatus: "UPLOADED",
            scanStatus: "PASSED"
          }
        ]
      }
    });

    await app.close();
  });

  it("lets a service officer list submitted service requests", async () => {
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
        "x-ssq-demo-role": "ServiceOfficer",
        "x-ssq-demo-subject": "officer@example.test"
      },
      method: "POST",
      payload: {
        query: `
          query SubmittedRequests {
            platform { demoRole demoSubject }
            submittedServiceRequests {
              referenceNumber
              status
              transactionKey
            }
            serviceRequest(referenceNumber: "SSQ-DEMO-0001") {
              referenceNumber
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
          demoRole: "ServiceOfficer",
          demoSubject: "officer@example.test"
        },
        submittedServiceRequests: [
          {
            referenceNumber: "SSQ-DEMO-0001",
            status: "SUBMITTED",
            transactionKey: "seniors-card"
          }
        ],
        serviceRequest: {
          referenceNumber: "SSQ-DEMO-0001"
        }
      }
    });

    await app.close();
  });

  it("returns submitted service request query contracts with paging filters and counts", async () => {
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
        "x-ssq-demo-role": "ServiceOfficer"
      },
      method: "POST",
      payload: {
        query: `
          query SubmittedConnection {
            submittedServiceRequestConnection(input: {
              status: "SUBMITTED"
              page: 1
              pageSize: 1
              sortBy: "referenceNumber"
              sortDirection: "ASC"
            }) {
              ok
              error { code message }
              connection {
                items { referenceNumber status transactionKey }
                pageInfo { page pageSize totalItems totalPages }
                statusCounts { status count }
              }
            }
          }
        `
      },
      url: "/graphql"
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      data: {
        submittedServiceRequestConnection: {
          ok: true,
          error: null,
          connection: {
            items: [
              {
                referenceNumber: "SSQ-DEMO-0001",
                status: "SUBMITTED",
                transactionKey: "seniors-card"
              }
            ],
            pageInfo: {
              page: 1,
              pageSize: 1,
              totalItems: 1,
              totalPages: 1
            },
            statusCounts: [
              {
                status: "SUBMITTED",
                count: 1
              }
            ]
          }
        }
      }
    });

    await app.close();
  });

  it("returns safe validation errors for invalid service request query contracts", async () => {
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
        "x-ssq-demo-role": "ServiceOfficer"
      },
      method: "POST",
      payload: {
        query: `
          query InvalidConnection {
            submittedServiceRequestConnection(input: {
              sortBy: "payload"
            }) {
              ok
              connection { pageInfo { totalItems } }
              error { code message }
            }
          }
        `
      },
      url: "/graphql"
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      data: {
        submittedServiceRequestConnection: {
          ok: false,
          connection: null,
          error: {
            code: "INVALID_SORT",
            message: "Sort field is not supported."
          }
        }
      }
    });

    await app.close();
  });

  it("creates, updates and resumes service request drafts for the demo customer", async () => {
    const app = await buildApp({
      config: loadConfig({
        NODE_ENV: "test",
        PORT: "7001"
      }),
      database: createGraphqlTestDatabase()
    });

    const createResponse = await app.inject({
      headers: {
        "content-type": "application/json"
      },
      method: "POST",
      payload: {
        query: `
          mutation CreateDraft($input: CreateServiceRequestDraftInput!) {
            createServiceRequestDraft(input: $input) {
              ok
              error { code message }
              draft {
                id
                transactionKey
                currentStep
                payload
              }
            }
          }
        `,
        variables: {
          input: {
            transactionKey: "seniors-card",
            currentStep: "eligibility",
            payload: {
              consent: true
            }
          }
        }
      },
      url: "/graphql"
    });

    expect(createResponse.statusCode).toBe(200);
    expect(createResponse.json()).toMatchObject({
      data: {
        createServiceRequestDraft: {
          ok: true,
          error: null,
          draft: {
            id: "70000000-0000-4000-8000-000000000001",
            transactionKey: "seniors-card",
            currentStep: "eligibility",
            payload: {
              consent: true
            }
          }
        }
      }
    });

    const updateResponse = await app.inject({
      headers: {
        "content-type": "application/json"
      },
      method: "POST",
      payload: {
        query: `
          mutation UpdateDraft($input: UpdateServiceRequestDraftInput!) {
            updateServiceRequestDraft(input: $input) {
              ok
              error { code }
              draft {
                id
                currentStep
                payload
              }
            }
          }
        `,
        variables: {
          input: {
            draftId: "70000000-0000-4000-8000-000000000001",
            currentStep: "details",
            payload: {
              consent: true,
              cardType: "seniors-card"
            }
          }
        }
      },
      url: "/graphql"
    });

    expect(updateResponse.statusCode).toBe(200);
    expect(updateResponse.json()).toMatchObject({
      data: {
        updateServiceRequestDraft: {
          ok: true,
          error: null,
          draft: {
            id: "70000000-0000-4000-8000-000000000001",
            currentStep: "details",
            payload: {
              cardType: "seniors-card",
              consent: true
            }
          }
        }
      }
    });

    const resumeResponse = await app.inject({
      headers: {
        "content-type": "application/json"
      },
      method: "POST",
      payload: {
        query: `
          query ResumeDraft {
            serviceRequestDrafts { id currentStep transactionKey }
            serviceRequestDraft(id: "70000000-0000-4000-8000-000000000001") {
              id
              currentStep
              payload
            }
          }
        `
      },
      url: "/graphql"
    });

    expect(resumeResponse.statusCode).toBe(200);
    expect(resumeResponse.json()).toMatchObject({
      data: {
        serviceRequestDrafts: [
          {
            id: "70000000-0000-4000-8000-000000000001",
            currentStep: "details",
            transactionKey: "seniors-card"
          }
        ],
        serviceRequestDraft: {
          id: "70000000-0000-4000-8000-000000000001",
          currentStep: "details",
          payload: {
            cardType: "seniors-card",
            consent: true
          }
        }
      }
    });

    await app.close();
  });

  it("returns safe draft mutation errors for invalid transaction keys", async () => {
    const app = await buildApp({
      config: loadConfig({
        NODE_ENV: "test",
        PORT: "7001"
      }),
      database: createGraphqlTestDatabase()
    });

    const response = await app.inject({
      headers: {
        "content-type": "application/json"
      },
      method: "POST",
      payload: {
        query: `
          mutation CreateInvalidDraft {
            createServiceRequestDraft(input: {
              transactionKey: "missing"
              currentStep: "eligibility"
              payload: {}
            }) {
              ok
              draft { id }
              error { code message }
            }
          }
        `
      },
      url: "/graphql"
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      data: {
        createServiceRequestDraft: {
          ok: false,
          draft: null,
          error: {
            code: "TRANSACTION_NOT_FOUND",
            message: "Transaction was not found."
          }
        }
      }
    });

    await app.close();
  });

  it("submits a valid draft and returns a submitted service request", async () => {
    const app = await buildApp({
      config: loadConfig({
        NODE_ENV: "test",
        PORT: "7001"
      }),
      database: createGraphqlTestDatabase()
    });

    await app.inject({
      headers: {
        "content-type": "application/json",
        "x-correlation-id": "submit-correlation"
      },
      method: "POST",
      payload: {
        query: `
          mutation CreateDraft($input: CreateServiceRequestDraftInput!) {
            createServiceRequestDraft(input: $input) { ok }
          }
        `,
        variables: {
          input: {
            transactionKey: "seniors-card",
            currentStep: "review",
            payload: {
              dateOfBirth: "1960-01-01",
              residencyStatus: "queensland-resident",
              concessionConsent: true
            }
          }
        }
      },
      url: "/graphql"
    });

    const response = await app.inject({
      headers: {
        "content-type": "application/json",
        "x-correlation-id": "submit-correlation"
      },
      method: "POST",
      payload: {
        query: `
          mutation SubmitDraft {
            submitServiceRequest(input: { draftId: "70000000-0000-4000-8000-000000000001" }) {
              ok
              error { code message }
              fieldErrors { field message }
              validationErrors
              serviceRequest {
                id
                referenceNumber
                status
                transactionKey
                payload
              }
            }
          }
        `
      },
      url: "/graphql"
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      data: {
        submitServiceRequest: {
          ok: true,
          error: null,
          fieldErrors: [],
          validationErrors: {},
              serviceRequest: {
                id: "30000000-0000-4000-8000-000000000099",
                status: "SUBMITTED",
                transactionKey: "seniors-card",
            payload: {
              dateOfBirth: "1960-01-01",
              residencyStatus: "queensland-resident",
              concessionConsent: true
            }
          }
        }
      }
    });
    const submittedReference = response.json().data.submitServiceRequest.serviceRequest.referenceNumber;

    expect(submittedReference).toMatch(/^SSQ-\d{8}-[A-F0-9]{8}$/);

    const evidenceResponse = await app.inject({
      headers: {
        "content-type": "application/json"
      },
      method: "POST",
      payload: {
        query: `
          query SubmittedEvidence {
            customerProfileEvidence(serviceRequestId: "30000000-0000-4000-8000-000000000099") {
              attributeKey
              evidenceSource
              verificationStatus
              evidenceMetadata
            }
          }
        `
      },
      url: "/graphql"
    });

    expect(evidenceResponse.statusCode).toBe(200);
    expect(evidenceResponse.json()).toMatchObject({
      data: {
        customerProfileEvidence: [
          {
            attributeKey: "residency",
            evidenceSource: "SIMULATED_PROFILE",
            verificationStatus: "SIMULATED_VERIFIED",
            evidenceMetadata: {
              availability: "AVAILABLE_LOCAL",
              gateway: "local-customer-profile-evidence-gateway",
              gatewayMode: "LOCAL_ADAPTER",
              integrationClaim: "local-adapter-only",
              source: "prototype-customer-profile"
            }
          },
          {
            attributeKey: "preferred_contact",
            evidenceSource: "SIMULATED_PROFILE",
            verificationStatus: "SIMULATED_UNVERIFIED",
            evidenceMetadata: {
              availability: "AVAILABLE_LOCAL",
              gateway: "local-customer-profile-evidence-gateway",
              gatewayMode: "LOCAL_ADAPTER",
              integrationClaim: "local-adapter-only",
              source: "prototype-customer-profile"
            }
          }
        ]
      }
    });

    const summaryResponse = await app.inject({
      headers: {
        "content-type": "application/json"
      },
      method: "POST",
      payload: {
        query: `
          query Summary {
            submissionSummary(referenceNumber: "${submittedReference}") {
              fileName
              contentType
              summaryPayload
            }
          }
        `
      },
      url: "/graphql"
    });

    expect(summaryResponse.statusCode).toBe(200);
    expect(summaryResponse.json()).toMatchObject({
      data: {
        submissionSummary: {
          fileName: `${submittedReference}-summary.txt`,
          contentType: "text/plain; charset=utf-8",
          summaryPayload: {
            referenceNumber: submittedReference,
            transactionKey: "seniors-card",
            transactionLabel: "Seniors Card"
          }
        }
      }
    });

    await app.close();
  });

  it("returns field-keyed validation errors when submitting an invalid draft", async () => {
    const app = await buildApp({
      config: loadConfig({
        NODE_ENV: "test",
        PORT: "7001"
      }),
      database: createGraphqlTestDatabase()
    });

    await app.inject({
      headers: {
        "content-type": "application/json"
      },
      method: "POST",
      payload: {
        query: `
          mutation CreateDraft($input: CreateServiceRequestDraftInput!) {
            createServiceRequestDraft(input: $input) { ok }
          }
        `,
        variables: {
          input: {
            transactionKey: "seniors-card",
            currentStep: "review",
            payload: {
              dateOfBirth: "not-a-date",
              concessionConsent: "yes"
            }
          }
        }
      },
      url: "/graphql"
    });

    const response = await app.inject({
      headers: {
        "content-type": "application/json"
      },
      method: "POST",
      payload: {
        query: `
          mutation SubmitInvalidDraft {
            submitServiceRequest(input: { draftId: "70000000-0000-4000-8000-000000000001" }) {
              ok
              serviceRequest { id }
              error { code message }
              fieldErrors { field message }
              validationErrors
            }
          }
        `
      },
      url: "/graphql"
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      data: {
        submitServiceRequest: {
          ok: false,
          serviceRequest: null,
          error: {
            code: "VALIDATION_FAILED",
            message: "Draft payload failed validation."
          },
          fieldErrors: [
            {
              field: "dateOfBirth"
            },
            {
              field: "residencyStatus"
            },
            {
              field: "concessionConsent"
            }
          ],
          validationErrors: {
            dateOfBirth: "Must be a valid date in YYYY-MM-DD format.",
            residencyStatus: "Required",
            concessionConsent: "Expected boolean, received string"
          }
        }
      }
    });

    await app.close();
  });

  it("updates service request status and projects activity logs", async () => {
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
        "x-correlation-id": "status-correlation",
        "x-ssq-demo-role": "ServiceOfficer"
      },
      method: "POST",
      payload: {
        query: `
          mutation UpdateStatus {
            updateServiceRequestStatus(input: {
              referenceNumber: "SSQ-DEMO-0001"
              status: "UNDER_REVIEW"
              reason: "Ready for review"
            }) {
              ok
              error { code message }
              serviceRequest { id referenceNumber status transactionKey }
            }
          }
        `
      },
      url: "/graphql"
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      data: {
        updateServiceRequestStatus: {
          ok: true,
          error: null,
          serviceRequest: {
            id: "30000000-0000-4000-8000-000000000001",
            referenceNumber: "SSQ-DEMO-0001",
            status: "UNDER_REVIEW",
            transactionKey: "seniors-card"
          }
        }
      }
    });

    const activityResponse = await app.inject({
      headers: {
        "content-type": "application/json",
        "x-ssq-demo-role": "ServiceOfficer"
      },
      method: "POST",
      payload: {
        query: `
          query Activity {
            activityLogs(serviceRequestId: "30000000-0000-4000-8000-000000000001") {
              eventType
              eventPayload
            }
          }
        `
      },
      url: "/graphql"
    });

    expect(activityResponse.statusCode).toBe(200);
    expect(activityResponse.json()).toMatchObject({
      data: {
        activityLogs: [
          {
            eventType: "SERVICE_REQUEST_SEEDED"
          },
          {
            eventType: "SERVICE_REQUEST_STATUS_CHANGED",
            eventPayload: {
              correlationId: "status-correlation",
              fromStatus: "SUBMITTED",
              reason: "Ready for review",
              toStatus: "UNDER_REVIEW"
            }
          }
        ]
      }
    });

    const invalidResponse = await app.inject({
      headers: {
        "content-type": "application/json",
        "x-ssq-demo-role": "ServiceOfficer"
      },
      method: "POST",
      payload: {
        query: `
          mutation InvalidStatus {
            updateServiceRequestStatus(input: {
              referenceNumber: "SSQ-DEMO-0001"
              status: "COMPLETED"
            }) {
              ok
              serviceRequest { id }
              error { code message }
            }
          }
        `
      },
      url: "/graphql"
    });

    expect(invalidResponse.statusCode).toBe(200);
    expect(invalidResponse.json()).toEqual({
      data: {
        updateServiceRequestStatus: {
          ok: false,
          serviceRequest: null,
          error: {
            code: "INVALID_STATUS_TRANSITION",
            message: "Cannot transition service request from SUBMITTED to COMPLETED."
          }
        }
      }
    });

    await app.close();
  });

  it("assigns submitted service requests and records reviewer audit events", async () => {
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
        "x-correlation-id": "assignment-correlation",
        "x-ssq-demo-role": "TeamLead",
        "x-ssq-demo-subject": "lead@example.test"
      },
      method: "POST",
      payload: {
        query: `
          mutation Assign {
            assignServiceRequest(input: {
              referenceNumber: "SSQ-DEMO-0001"
              assignedOfficerSubject: "officer@example.test"
              assignedTeam: "Seniors Card"
              reason: "Queue triage"
            }) {
              ok
              error { code message }
              serviceRequest {
                referenceNumber
                assignedOfficerSubject
                assignedTeam
                lastTouchedBy
                lastTouchedAt
              }
            }
          }
        `
      },
      url: "/graphql"
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      data: {
        assignServiceRequest: {
          ok: true,
          error: null,
          serviceRequest: {
            referenceNumber: "SSQ-DEMO-0001",
            assignedOfficerSubject: "officer@example.test",
            assignedTeam: "Seniors Card",
            lastTouchedBy: "lead@example.test",
            lastTouchedAt: "2026-06-10T00:35:00.000Z"
          }
        }
      }
    });

    const activityResponse = await app.inject({
      headers: {
        "content-type": "application/json",
        "x-ssq-demo-role": "ServiceOfficer"
      },
      method: "POST",
      payload: {
        query: `
          query Activity {
            activityLogs(serviceRequestId: "30000000-0000-4000-8000-000000000001") {
              eventType
              eventPayload
            }
          }
        `
      },
      url: "/graphql"
    });

    expect(activityResponse.statusCode).toBe(200);
    expect(activityResponse.json()).toMatchObject({
      data: {
        activityLogs: [
          {
            eventType: "SERVICE_REQUEST_SEEDED"
          },
          {
            eventType: "SERVICE_REQUEST_ASSIGNMENT_CHANGED",
            eventPayload: {
              actorRole: "TeamLead",
              actorSubject: "lead@example.test",
              assignedOfficerSubject: "officer@example.test",
              assignedTeam: "Seniors Card",
              correlationId: "assignment-correlation",
              reason: "Queue triage"
            }
          }
        ]
      }
    });

    await app.close();
  });

  it("returns per-record results for batch service request status updates", async () => {
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
        "x-correlation-id": "batch-correlation",
        "x-ssq-demo-role": "ServiceOfficer",
        "x-ssq-demo-subject": "officer@example.test"
      },
      method: "POST",
      payload: {
        query: `
          mutation BatchStatus {
            batchUpdateServiceRequestStatus(input: {
              referenceNumbers: ["SSQ-DEMO-0001", "SSQ-MISSING"]
              status: "UNDER_REVIEW"
            }) {
              ok
              error { code message }
              results {
                ok
                referenceNumber
                error { code message }
                serviceRequest {
                  referenceNumber
                  status
                  lastTouchedBy
                }
              }
            }
          }
        `
      },
      url: "/graphql"
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      data: {
        batchUpdateServiceRequestStatus: {
          ok: false,
          error: {
            code: "PARTIAL_FAILURE"
          },
          results: [
            {
              ok: true,
              referenceNumber: "SSQ-DEMO-0001",
              error: null,
              serviceRequest: {
                referenceNumber: "SSQ-DEMO-0001",
                status: "UNDER_REVIEW",
                lastTouchedBy: "officer@example.test"
              }
            },
            {
              ok: false,
              referenceNumber: "SSQ-MISSING",
              error: {
                code: "SERVICE_REQUEST_NOT_FOUND"
              },
              serviceRequest: null
            }
          ]
        }
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
        title: "Seniors Card",
        prefillProfileAttributes: ["residency", "preferred_contact"],
        required: ["dateOfBirth", "residencyStatus"],
        properties: {
          dateOfBirth: {
            type: "string",
            format: "date"
          },
          residencyStatus: {
            type: "string",
            enum: ["queensland-resident", "moving-to-queensland"]
          },
          concessionConsent: {
            type: "boolean"
          }
        }
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

function filterServiceRequestRows(rows: QueryResultRow[], normalizedSql: string, values: readonly unknown[]): QueryResultRow[] {
  return rows.filter((row) => {
    if (normalizedSql.includes("sr.customer_id = $1") && row.customer_id !== values[0]) {
      return false;
    }

    if (normalizedSql.includes("sr.status <> 'DRAFT'") && row.status === "DRAFT") {
      return false;
    }

    const statusIndex = values.findIndex((value) => value === "DRAFT"
      || value === "SUBMITTED"
      || value === "UNDER_REVIEW"
      || value === "ACTION_REQUIRED"
      || value === "COMPLETED"
      || value === "WITHDRAWN");

    if (normalizedSql.includes("sr.status = $") && statusIndex >= 0 && row.status !== values[statusIndex]) {
      return false;
    }

    const searchValue = values.find((value) => typeof value === "string" && value.startsWith("%") && value.endsWith("%"));

    if (searchValue) {
      const needle = String(searchValue).replaceAll("%", "").toLowerCase();
      const referenceNumber = String(row.reference_number).toLowerCase();
      const transactionKey = String(row.transaction_key ?? "").toLowerCase();

      if (!referenceNumber.includes(needle) && !transactionKey.includes(needle)) {
        return false;
      }
    }

    return true;
  });
}
