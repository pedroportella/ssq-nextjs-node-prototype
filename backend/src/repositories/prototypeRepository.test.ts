import { describe, expect, it } from "vitest";

import { PrototypeRepository } from "./prototypeRepository.js";

import type { QueryResult, QueryResultRow } from "pg";
import type { Queryable } from "../database/types.js";

class SeededTestDatabase implements Queryable {
  private readonly customerProfileEvidence: QueryResultRow[] = [];
  private readonly outboxEvents: QueryResultRow[] = [];
  private readonly serviceRequestEvents: QueryResultRow[] = [];
  private readonly serviceRequests: QueryResultRow[] = [];
  private readonly serviceRequestDrafts: QueryResultRow[] = [];
  private readonly submissionSummaries: QueryResultRow[] = [];

  async query<T extends QueryResultRow = QueryResultRow>(sql: string, values: readonly unknown[] = []): Promise<QueryResult<T>> {
    const normalizedSql = sql.replace(/\s+/g, " ").trim();

    if (!normalizedSql.startsWith("UPDATE service_requests sr") && normalizedSql.includes("FROM transaction_definitions td")) {
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

    if (!normalizedSql.startsWith("UPDATE service_requests sr") && normalizedSql.includes("FROM transaction_definitions")) {
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

    if (normalizedSql.startsWith("INSERT INTO outbox_events")) {
      const row = {
        id: `92000000-0000-4000-8000-00000000000${this.outboxEvents.length + 1}`,
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

      this.outboxEvents.push(row);
      return result<T>([row as unknown as T]);
    }

    if (normalizedSql.startsWith("INSERT INTO submission_summaries")) {
      const existing = this.submissionSummaries.find((row) => row.service_request_id === values[0]);
      const row = {
        id: existing?.id ?? "91000000-0000-4000-8000-000000000001",
        service_request_id: String(values[0]),
        summary_format: String(values[1]),
        content_type: String(values[2]),
        file_name: String(values[3]),
        summary_payload: JSON.parse(String(values[4])),
        summary_text: String(values[5]),
        created_at: "2026-06-10T00:20:00.000Z",
        updated_at: "2026-06-10T00:20:00.000Z"
      };

      if (existing) {
        Object.assign(existing, row);
      } else {
        this.submissionSummaries.push(row);
      }

      return result<T>([row as unknown as T]);
    }

    if (normalizedSql.startsWith("INSERT INTO customer_profile_evidence")) {
      const row = {
        id: "80000000-0000-4000-8000-000000000001",
        service_request_id: String(values[0]),
        customer_profile_attribute_id: values[1] === null ? null : String(values[1]),
        attribute_key: String(values[2]),
        attribute_value: JSON.parse(String(values[3])),
        evidence_source: "SIMULATED_PROFILE",
        verification_status: String(values[4]),
        evidence_metadata: JSON.parse(String(values[5])),
        created_at: "2026-06-10T00:15:00.000Z"
      };

      this.customerProfileEvidence.push(row);
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

    if (normalizedSql.startsWith("UPDATE service_requests sr")) {
      const request = this.serviceRequests.find((row) => row.reference_number === values[0] && row.customer_id === values[1]);

      if (!request) {
        return result<T>([]);
      }

      request.status = String(values[2]);

      return result<T>([
        {
          ...request,
          transaction_key: "seniors-card"
        } as unknown as T
      ]);
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
      if (normalizedSql.startsWith("SELECT count(*) AS total_count")) {
        const rows = filterServiceRequestRows(this.serviceRequests, normalizedSql, values);

        return result<T>([
          {
            total_count: rows.length
          } as unknown as T
        ]);
      }

      if (normalizedSql.startsWith("SELECT sr.status, count(*) AS status_count")) {
        const counts = new Map<string, number>();

        for (const row of filterServiceRequestRows(this.serviceRequests, normalizedSql, values)) {
          counts.set(String(row.status), (counts.get(String(row.status)) ?? 0) + 1);
        }

        return result<T>([...counts.entries()].map(([status, count]) => ({
          status,
          status_count: count
        })) as unknown as T[]);
      }

      if (normalizedSql.includes("LIMIT")) {
        const rows = filterServiceRequestRows(this.serviceRequests, normalizedSql, values);
        const pageSize = Number(values.at(-2));
        const offset = Number(values.at(-1));

        return result<T>(rows.slice(offset, offset + pageSize) as T[]);
      }

      if (normalizedSql.includes("WHERE sr.reference_number = $1 AND sr.customer_id = $2")) {
        return result<T>(
          this.serviceRequests.filter((row) => row.reference_number === values[0] && row.customer_id === values[1]) as T[]
        );
      }

      if (normalizedSql.includes("WHERE sr.reference_number = $1")) {
        return result<T>(this.serviceRequests.filter((row) => row.reference_number === values[0]) as T[]);
      }

      if (normalizedSql.includes("WHERE sr.status <> 'DRAFT'")) {
        return result<T>(this.serviceRequests.filter((row) => row.status !== "DRAFT") as T[]);
      }

      return result<T>(this.serviceRequests.filter((row) => row.customer_id === values[0]) as T[]);
    }

    if (normalizedSql.includes("FROM service_request_events")) {
      return result<T>(this.serviceRequestEvents.filter((row) => row.service_request_id === values[0]) as T[]);
    }

    if (normalizedSql.includes("FROM outbox_events")) {
      const counts = new Map<string, { event_type: string; status: string; event_count: number }>();

      for (const event of this.outboxEvents) {
        const key = `${event.event_type}:${event.status}`;
        const count = counts.get(key) ?? {
          event_type: String(event.event_type),
          status: String(event.status),
          event_count: 0
        };

        count.event_count += 1;
        counts.set(key, count);
      }

      return result<T>([...counts.values()] as unknown as T[]);
    }

    if (normalizedSql.includes("FROM customer_profile_evidence")) {
      return result<T>(this.customerProfileEvidence.filter((row) => row.service_request_id === values[0]) as T[]);
    }

    if (normalizedSql.includes("FROM submission_summaries ss")) {
      const serviceRequest = this.serviceRequests.find((row) => row.customer_id === values[0] && row.reference_number === values[1]);
      const rows = serviceRequest
        ? this.submissionSummaries.filter((row) => row.service_request_id === serviceRequest.id)
        : [];

      return result<T>(rows as T[]);
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

  it("lists submitted service requests for review roles", async () => {
    const database = new SeededTestDatabase();
    const repository = new PrototypeRepository(database);

    await repository.createServiceRequest({
      customerId: "10000000-0000-4000-8000-000000000001",
      transactionDefinitionId: "20000000-0000-4000-8000-000000000002",
      referenceNumber: "SSQ-TEST-REVIEW-0001",
      status: "SUBMITTED",
      payload: {
        prototype: true
      }
    });

    const requests = await repository.listSubmittedServiceRequests();

    expect(requests).toHaveLength(1);
    expect(requests[0]).toMatchObject({
      referenceNumber: "SSQ-TEST-REVIEW-0001",
      status: "SUBMITTED"
    });
  });

  it("returns paged service request query contracts with status counts", async () => {
    const database = new SeededTestDatabase();
    const repository = new PrototypeRepository(database);

    await repository.createServiceRequest({
      customerId: "10000000-0000-4000-8000-000000000001",
      transactionDefinitionId: "20000000-0000-4000-8000-000000000002",
      referenceNumber: "SSQ-TEST-CONTRACT-0001",
      status: "SUBMITTED",
      payload: {}
    });
    await repository.createServiceRequest({
      customerId: "10000000-0000-4000-8000-000000000001",
      transactionDefinitionId: "20000000-0000-4000-8000-000000000002",
      referenceNumber: "SSQ-TEST-CONTRACT-0002",
      status: "UNDER_REVIEW",
      payload: {}
    });

    const result = await repository.listServiceRequestConnection({
      customerId: "10000000-0000-4000-8000-000000000001",
      page: 1,
      pageSize: 1,
      sortBy: "referenceNumber",
      sortDirection: "ASC"
    });

    expect(result.items).toHaveLength(1);
    expect(result.pageInfo).toEqual({
      page: 1,
      pageSize: 1,
      totalItems: 2,
      totalPages: 2
    });
    expect(result.statusCounts).toEqual([
      {
        status: "SUBMITTED",
        count: 1
      },
      {
        status: "UNDER_REVIEW",
        count: 1
      }
    ]);
  });

  it("updates customer-owned service request status", async () => {
    const database = new SeededTestDatabase();
    const repository = new PrototypeRepository(database);
    const serviceRequest = await repository.createServiceRequest({
      customerId: "10000000-0000-4000-8000-000000000001",
      transactionDefinitionId: "20000000-0000-4000-8000-000000000002",
      referenceNumber: "SSQ-TEST-0002",
      status: "SUBMITTED",
      payload: {}
    });

    const updated = await repository.updateServiceRequestStatusForCustomer({
      customerId: serviceRequest.customerId,
      referenceNumber: serviceRequest.referenceNumber,
      status: "UNDER_REVIEW"
    });
    const otherCustomerUpdate = await repository.updateServiceRequestStatusForCustomer({
      customerId: "10000000-0000-4000-8000-000000000999",
      referenceNumber: serviceRequest.referenceNumber,
      status: "WITHDRAWN"
    });

    expect(updated).toMatchObject({
      referenceNumber: "SSQ-TEST-0002",
      status: "UNDER_REVIEW",
      transactionKey: "seniors-card"
    });
    expect(otherCustomerUpdate).toBeUndefined();
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

  it("creates and summarises outbox events", async () => {
    const database = new SeededTestDatabase();
    const repository = new PrototypeRepository(database);

    const event = await repository.createOutboxEvent({
      eventType: "ServiceRequestSubmitted",
      aggregateType: "ServiceRequest",
      aggregateId: "30000000-0000-4000-8000-000000000099",
      eventPayload: {
        correlationId: "test-correlation"
      }
    });
    const summaries = await repository.listOutboxEventSummaries();

    expect(event).toMatchObject({
      eventType: "ServiceRequestSubmitted",
      aggregateType: "ServiceRequest",
      status: "PENDING",
      eventPayload: {
        correlationId: "test-correlation"
      }
    });
    expect(summaries).toEqual([
      {
        eventType: "ServiceRequestSubmitted",
        status: "PENDING",
        eventCount: 1
      }
    ]);
  });

  it("creates and reads submission summaries for customer-owned requests", async () => {
    const database = new SeededTestDatabase();
    const repository = new PrototypeRepository(database);
    const serviceRequest = await repository.createServiceRequest({
      customerId: "10000000-0000-4000-8000-000000000001",
      transactionDefinitionId: "20000000-0000-4000-8000-000000000002",
      referenceNumber: "SSQ-TEST-0003",
      status: "SUBMITTED",
      payload: {
        prototype: true
      }
    });

    const summary = await repository.createSubmissionSummary({
      serviceRequestId: serviceRequest.id,
      summaryFormat: "TEXT",
      contentType: "text/plain; charset=utf-8",
      fileName: "SSQ-TEST-0003-summary.txt",
      summaryPayload: {
        referenceNumber: serviceRequest.referenceNumber
      },
      summaryText: "Reference: SSQ-TEST-0003"
    });
    const ownedSummary = await repository.getSubmissionSummaryForCustomerByReference({
      customerId: serviceRequest.customerId,
      referenceNumber: serviceRequest.referenceNumber
    });
    const otherCustomerSummary = await repository.getSubmissionSummaryForCustomerByReference({
      customerId: "10000000-0000-4000-8000-000000000999",
      referenceNumber: serviceRequest.referenceNumber
    });

    expect(summary).toMatchObject({
      fileName: "SSQ-TEST-0003-summary.txt",
      summaryText: "Reference: SSQ-TEST-0003"
    });
    expect(ownedSummary?.id).toBe(summary.id);
    expect(otherCustomerSummary).toBeUndefined();
  });

  it("creates and reads simulated customer profile evidence", async () => {
    const database = new SeededTestDatabase();
    const repository = new PrototypeRepository(database);
    const [attribute] = await repository.listCustomerProfileAttributesByKeys({
      customerId: "10000000-0000-4000-8000-000000000001",
      attributeKeys: ["residency"]
    });

    const evidence = await repository.createCustomerProfileEvidence({
      serviceRequestId: "30000000-0000-4000-8000-000000000099",
      customerProfileAttributeId: attribute?.id,
      attributeKey: "residency",
      attributeValue: attribute?.attributeValue ?? {},
      verificationStatus: "SIMULATED_VERIFIED",
      evidenceMetadata: {
        integrationClaim: "none",
        source: "prototype-customer-profile"
      }
    });
    const evidenceRecords = await repository.listCustomerProfileEvidence(evidence.serviceRequestId);

    expect(evidence).toMatchObject({
      attributeKey: "residency",
      evidenceSource: "SIMULATED_PROFILE",
      verificationStatus: "SIMULATED_VERIFIED",
      evidenceMetadata: {
        integrationClaim: "none"
      }
    });
    expect(evidenceRecords).toHaveLength(1);
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
        prefillProfileAttributes: ["residency", "preferred_contact"],
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
