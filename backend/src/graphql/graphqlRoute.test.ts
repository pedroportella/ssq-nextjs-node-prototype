import { describe, expect, it } from "vitest";

import { buildApp } from "../app.js";
import { loadConfig } from "../config.js";

import type { DatabaseClient } from "../database/client.js";
import type { QueryResult, QueryResultRow } from "pg";

function createGraphqlTestDatabase(): DatabaseClient {
  const customerProfileEvidence: QueryResultRow[] = [];
  const serviceRequestEvents: QueryResultRow[] = [];
  const serviceRequests: QueryResultRow[] = [];
  const serviceRequestDrafts: QueryResultRow[] = [];

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
            payload: JSON.parse(String(values[4]))
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
          const submitted = serviceRequests.find((row) => row.reference_number === values[0] && row.customer_id === values[1]);

          if (submitted) {
            submitted.status = String(values[2]);

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
                }
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
          const seededRows = [
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
            }
          ];
          const submittedRows = serviceRequests.map((row) => ({
            ...row,
            transaction_key: "seniors-card"
          }));

          return result<T>([...seededRows, ...submittedRows] as unknown as T[]);
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
    expect(response.json().data.submitServiceRequest.serviceRequest.referenceNumber).toMatch(/^SSQ-\d{8}-[A-F0-9]{8}$/);

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
              integrationClaim: "none",
              source: "prototype-customer-profile"
            }
          },
          {
            attributeKey: "preferred_contact",
            evidenceSource: "SIMULATED_PROFILE",
            verificationStatus: "SIMULATED_UNVERIFIED",
            evidenceMetadata: {
              integrationClaim: "none",
              source: "prototype-customer-profile"
            }
          }
        ]
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
        "x-correlation-id": "status-correlation"
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
        "content-type": "application/json"
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
        "content-type": "application/json"
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
