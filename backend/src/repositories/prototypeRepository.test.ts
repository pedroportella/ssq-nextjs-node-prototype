import { describe, expect, it } from "vitest";

import { PrototypeRepository } from "./prototypeRepository.js";

import type { QueryResult, QueryResultRow } from "pg";
import type { Queryable } from "../database/types.js";

class SeededTestDatabase implements Queryable {
  private readonly serviceRequestEvents: QueryResultRow[] = [];
  private readonly serviceRequests: QueryResultRow[] = [];
  private readonly serviceRequestDrafts: QueryResultRow[] = [];

  async query<T extends QueryResultRow = QueryResultRow>(sql: string, values: readonly unknown[] = []): Promise<QueryResult<T>> {
    const normalizedSql = sql.replace(/\s+/g, " ").trim();

    if (normalizedSql.includes("FROM transaction_definitions td")) {
      const rows = catalogueRows();

      if (normalizedSql.includes("WHERE td.transaction_key = $1")) {
        return result<T>(rows.filter((row) => row.transaction_key === values[0]) as T[]);
      }

      return result<T>(rows.filter((row) => row.status === "ENABLED" && row.feature_enabled) as T[]);
    }

    if (normalizedSql.includes("FROM customers")) {
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

    if (normalizedSql.includes("FROM transaction_definitions")) {
      return result<T>([
        {
          id: "20000000-0000-4000-8000-000000000001",
          transaction_key: "dashboard",
          label: "Customer dashboard",
          description: "Prototype customer portal overview and service request summary.",
          status: "ENABLED",
          owning_agency: "Smart Service Queensland"
        } as unknown as T,
        {
          id: "20000000-0000-4000-8000-000000000002",
          transaction_key: "seniors-card",
          label: "Seniors Card",
          description: "Prototype Seniors Card transaction for eligibility and application flow.",
          status: "ENABLED",
          owning_agency: "Smart Service Queensland"
        } as unknown as T
      ]);
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

      this.serviceRequests.push(row);
      return result<T>([row as unknown as T]);
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

      this.serviceRequestDrafts.push(row);
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

      this.serviceRequestEvents.push(row);
      return result<T>([row as unknown as T]);
    }

    if (normalizedSql.startsWith("UPDATE service_request_drafts")) {
      const draft = this.serviceRequestDrafts.find((row) => row.id === values[0] && row.customer_id === values[1]);

      if (!draft) {
        return result<T>([]);
      }

      draft.current_step = String(values[2]);
      draft.payload = JSON.parse(String(values[3]));
      draft.updated_at = "2026-06-10T00:05:00.000Z";

      return result<T>([draft as unknown as T]);
    }

    if (normalizedSql.includes("FROM service_request_drafts srd")) {
      const rows = this.serviceRequestDrafts
        .filter((row) => normalizedSql.includes("WHERE srd.id = $1")
          ? row.id === values[0] && row.customer_id === values[1]
          : row.customer_id === values[0])
        .map((row) => ({
          ...row,
          transaction_key: "seniors-card"
        }));

      return result<T>(rows as unknown as T[]);
    }

    if (normalizedSql.includes("FROM service_requests")) {
      return result<T>(this.serviceRequests.filter((row) => row.customer_id === values[0]) as T[]);
    }

    if (normalizedSql.includes("FROM service_request_events")) {
      return result<T>(this.serviceRequestEvents.filter((row) => row.service_request_id === values[0]) as T[]);
    }

    return result<T>([]);
  }
}

describe("PrototypeRepository", () => {
  it("reads seeded customer and transaction records", async () => {
    const repository = new PrototypeRepository(new SeededTestDatabase());

    const customer = await repository.getCustomerByEmail("demo.customer@example.test");
    const transactions = await repository.listTransactionDefinitions();

    expect(customer).toMatchObject({
      externalRef: "MYQLD-DEMO-001",
      givenName: "Taylor"
    });
    expect(transactions.map((transaction) => transaction.transactionKey)).toEqual(["dashboard", "seniors-card"]);
  });

  it("creates and reads service requests", async () => {
    const database = new SeededTestDatabase();
    const repository = new PrototypeRepository(database);

    const serviceRequest = await repository.createServiceRequest({
      customerId: "10000000-0000-4000-8000-000000000001",
      transactionDefinitionId: "20000000-0000-4000-8000-000000000002",
      referenceNumber: "SSQ-TEST-0001",
      status: "DRAFT",
      payload: {
        step: "eligibility"
      }
    });
    const requests = await repository.listServiceRequestsForCustomer(serviceRequest.customerId);

    expect(serviceRequest).toMatchObject({
      referenceNumber: "SSQ-TEST-0001",
      status: "DRAFT",
      payload: {
        step: "eligibility"
      }
    });
    expect(requests).toHaveLength(1);
    expect(requests[0]?.referenceNumber).toBe("SSQ-TEST-0001");
  });

  it("creates and reads service request events", async () => {
    const database = new SeededTestDatabase();
    const repository = new PrototypeRepository(database);

    const event = await repository.createServiceRequestEvent({
      serviceRequestId: "30000000-0000-4000-8000-000000000099",
      eventType: "SERVICE_REQUEST_SUBMITTED",
      eventPayload: {
        correlationId: "test-correlation"
      }
    });
    const activityLogs = await repository.listActivityLogs(event.serviceRequestId);

    expect(event).toMatchObject({
      eventType: "SERVICE_REQUEST_SUBMITTED",
      eventPayload: {
        correlationId: "test-correlation"
      }
    });
    expect(activityLogs).toHaveLength(1);
  });

  it("creates, updates and reads customer-owned service request drafts", async () => {
    const database = new SeededTestDatabase();
    const repository = new PrototypeRepository(database);

    const draft = await repository.createServiceRequestDraft({
      customerId: "10000000-0000-4000-8000-000000000001",
      transactionDefinitionId: "20000000-0000-4000-8000-000000000002",
      currentStep: "eligibility",
      payload: {
        consent: true
      }
    });
    const updated = await repository.updateServiceRequestDraftForCustomer({
      draftId: draft.id,
      customerId: draft.customerId,
      currentStep: "details",
      payload: {
        consent: true,
        cardType: "seniors-card"
      }
    });
    const otherCustomerUpdate = await repository.updateServiceRequestDraftForCustomer({
      draftId: draft.id,
      customerId: "10000000-0000-4000-8000-000000000999",
      currentStep: "details",
      payload: {}
    });
    const drafts = await repository.listServiceRequestDraftsForCustomer(draft.customerId);
    const resumed = await repository.getServiceRequestDraftForCustomer({
      draftId: draft.id,
      customerId: draft.customerId
    });

    expect(updated).toMatchObject({
      id: draft.id,
      currentStep: "details",
      payload: {
        consent: true,
        cardType: "seniors-card"
      }
    });
    expect(otherCustomerUpdate).toBeUndefined();
    expect(drafts).toHaveLength(1);
    expect(drafts[0]?.transactionKey).toBe("seniors-card");
    expect(resumed?.id).toBe(draft.id);
  });

  it("reads enabled transaction catalogue records with schemas and flags", async () => {
    const repository = new PrototypeRepository(new SeededTestDatabase());

    const catalogue = await repository.listEnabledTransactionCatalogue();
    const seniorsCard = await repository.getTransactionCatalogueEntry("seniors-card");

    expect(catalogue.map((transaction) => transaction.transactionKey)).toEqual(["dashboard", "seniors-card"]);
    expect(seniorsCard).toMatchObject({
      transactionKey: "seniors-card",
      schemaVersion: "2026-06-10",
      featureFlagKey: "transaction.seniors-card.enabled",
      featureEnabled: true
    });
    expect(seniorsCard?.schema).toMatchObject({
      title: "Seniors Card"
    });
  });
});

function catalogueRows(): QueryResultRow[] {
  return [
    {
      id: "20000000-0000-4000-8000-000000000001",
      transaction_key: "dashboard",
      label: "Customer dashboard",
      description: "Prototype customer portal overview and service request summary.",
      status: "ENABLED",
      owning_agency: "Smart Service Queensland",
      schema_version: "2026-06-10",
      schema_json: {
        title: "Customer dashboard"
      },
      feature_flag_key: "transaction.dashboard.enabled",
      feature_enabled: true
    },
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
    },
    {
      id: "20000000-0000-4000-8000-000000000003",
      transaction_key: "rental-security-subsidy",
      label: "Rental Security Subsidy",
      description: "Prototype Rental Security Subsidy transaction for housing support workflow.",
      status: "ENABLED",
      owning_agency: "Smart Service Queensland",
      schema_version: "2026-06-10",
      schema_json: {
        title: "Rental Security Subsidy",
        required: ["householdIncome", "rentalBondAmount"],
        properties: {
          householdIncome: {
            type: "number",
            minimum: 0
          },
          rentalBondAmount: {
            type: "number",
            minimum: 0
          },
          supportingDocuments: {
            type: "array",
            items: {
              type: "string"
            }
          }
        }
      },
      feature_flag_key: "transaction.rental-security-subsidy.enabled",
      feature_enabled: false
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
