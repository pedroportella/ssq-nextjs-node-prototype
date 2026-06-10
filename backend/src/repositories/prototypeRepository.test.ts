import { describe, expect, it } from "vitest";

import { PrototypeRepository } from "./prototypeRepository.js";

import type { QueryResult, QueryResultRow } from "pg";
import type { Queryable } from "../database/types.js";

class SeededTestDatabase implements Queryable {
  private readonly serviceRequests: QueryResultRow[] = [];

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

    if (normalizedSql.includes("FROM service_requests")) {
      return result<T>(this.serviceRequests.filter((row) => row.customer_id === values[0]) as T[]);
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
        title: "Seniors Card"
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
        title: "Rental Security Subsidy"
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
