import type { Queryable } from "../database/types.js";

export interface CustomerRecord {
  id: string;
  externalRef: string;
  email: string;
  givenName: string;
  familyName: string;
}

export interface TransactionDefinitionRecord {
  id: string;
  transactionKey: string;
  label: string;
  description: string;
  status: "ENABLED" | "DISABLED";
  owningAgency: string;
}

export interface ServiceRequestRecord {
  id: string;
  customerId: string;
  transactionDefinitionId: string;
  referenceNumber: string;
  status: "DRAFT" | "SUBMITTED" | "IN_REVIEW" | "APPROVED" | "DECLINED";
  payload: Record<string, unknown>;
}

interface CustomerRow {
  id: string;
  external_ref: string;
  email: string;
  given_name: string;
  family_name: string;
}

interface TransactionDefinitionRow {
  id: string;
  transaction_key: string;
  label: string;
  description: string;
  status: TransactionDefinitionRecord["status"];
  owning_agency: string;
}

interface ServiceRequestRow {
  id: string;
  customer_id: string;
  transaction_definition_id: string;
  reference_number: string;
  status: ServiceRequestRecord["status"];
  payload: Record<string, unknown>;
}

export class PrototypeRepository {
  constructor(private readonly database: Queryable) {}

  async getCustomerByEmail(email: string): Promise<CustomerRecord | undefined> {
    const result = await this.database.query<CustomerRow>(
      `
        SELECT id, external_ref, email, given_name, family_name
        FROM customers
        WHERE email = $1
      `,
      [email]
    );

    return result.rows[0] ? mapCustomer(result.rows[0]) : undefined;
  }

  async listTransactionDefinitions(): Promise<TransactionDefinitionRecord[]> {
    const result = await this.database.query<TransactionDefinitionRow>(`
      SELECT id, transaction_key, label, description, status, owning_agency
      FROM transaction_definitions
      ORDER BY transaction_key ASC
    `);

    return result.rows.map(mapTransactionDefinition);
  }

  async createServiceRequest(input: {
    customerId: string;
    transactionDefinitionId: string;
    referenceNumber: string;
    status: ServiceRequestRecord["status"];
    payload?: Record<string, unknown>;
  }): Promise<ServiceRequestRecord> {
    const result = await this.database.query<ServiceRequestRow>(
      `
        INSERT INTO service_requests (
          customer_id,
          transaction_definition_id,
          reference_number,
          status,
          payload
        )
        VALUES ($1, $2, $3, $4, $5::jsonb)
        RETURNING id, customer_id, transaction_definition_id, reference_number, status, payload
      `,
      [
        input.customerId,
        input.transactionDefinitionId,
        input.referenceNumber,
        input.status,
        JSON.stringify(input.payload ?? {})
      ]
    );

    return mapServiceRequest(result.rows[0]);
  }

  async listServiceRequestsForCustomer(customerId: string): Promise<ServiceRequestRecord[]> {
    const result = await this.database.query<ServiceRequestRow>(
      `
        SELECT id, customer_id, transaction_definition_id, reference_number, status, payload
        FROM service_requests
        WHERE customer_id = $1
        ORDER BY created_at DESC
      `,
      [customerId]
    );

    return result.rows.map(mapServiceRequest);
  }
}

function mapCustomer(row: CustomerRow): CustomerRecord {
  return {
    id: row.id,
    externalRef: row.external_ref,
    email: row.email,
    givenName: row.given_name,
    familyName: row.family_name
  };
}

function mapTransactionDefinition(row: TransactionDefinitionRow): TransactionDefinitionRecord {
  return {
    id: row.id,
    transactionKey: row.transaction_key,
    label: row.label,
    description: row.description,
    status: row.status,
    owningAgency: row.owning_agency
  };
}

function mapServiceRequest(row: ServiceRequestRow): ServiceRequestRecord {
  return {
    id: row.id,
    customerId: row.customer_id,
    transactionDefinitionId: row.transaction_definition_id,
    referenceNumber: row.reference_number,
    status: row.status,
    payload: row.payload
  };
}
