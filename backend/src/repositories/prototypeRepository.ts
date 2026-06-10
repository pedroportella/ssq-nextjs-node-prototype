import type { Queryable } from "../database/types.js";

export interface CustomerRecord {
  id: string;
  externalRef: string;
  email: string;
  givenName: string;
  familyName: string;
}

export interface CustomerProfileAttributeRecord {
  id: string;
  customerId: string;
  attributeKey: string;
  attributeValue: Record<string, unknown>;
}

export interface CustomerProfileEvidenceRecord {
  id: string;
  serviceRequestId: string;
  customerProfileAttributeId?: string;
  attributeKey: string;
  attributeValue: Record<string, unknown>;
  evidenceSource: "SIMULATED_PROFILE";
  verificationStatus: "SIMULATED_VERIFIED" | "SIMULATED_UNVERIFIED";
  evidenceMetadata: Record<string, unknown>;
  createdAt: string;
}

export interface TransactionDefinitionRecord {
  id: string;
  transactionKey: string;
  label: string;
  description: string;
  status: "ENABLED" | "DISABLED";
  owningAgency: string;
}

export interface TransactionCatalogueRecord extends TransactionDefinitionRecord {
  schemaVersion: string;
  schema: Record<string, unknown>;
  featureFlagKey: string;
  featureEnabled: boolean;
}

export interface FeatureFlagRecord {
  id: string;
  flagKey: string;
  description: string;
  enabled: boolean;
  metadata: Record<string, unknown>;
}

export interface ServiceRequestRecord {
  id: string;
  customerId: string;
  transactionDefinitionId: string;
  referenceNumber: string;
  status: "DRAFT" | "SUBMITTED" | "IN_REVIEW" | "APPROVED" | "DECLINED";
  payload: Record<string, unknown>;
  transactionKey?: string;
}

export interface ServiceRequestDraftRecord {
  id: string;
  customerId: string;
  transactionDefinitionId: string;
  transactionKey?: string;
  currentStep: string;
  payload: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceRequestEventRecord {
  id: string;
  serviceRequestId: string;
  eventType: string;
  eventPayload: Record<string, unknown>;
  createdAt: string;
}

export interface SupportingDocumentRecord {
  id: string;
  customerId: string;
  serviceRequestDraftId?: string;
  serviceRequestId?: string;
  category: string;
  fileName: string;
  fileExtension: string;
  mimeType: string;
  sizeBytes: number;
  storageKey: string;
  uploadStatus: string;
  scanStatus: string;
  retentionPolicy: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

interface CustomerRow {
  id: string;
  external_ref: string;
  email: string;
  given_name: string;
  family_name: string;
}

interface CustomerProfileAttributeRow {
  id: string;
  customer_id: string;
  attribute_key: string;
  attribute_value: Record<string, unknown>;
}

interface CustomerProfileEvidenceRow {
  id: string;
  service_request_id: string;
  customer_profile_attribute_id?: string | null;
  attribute_key: string;
  attribute_value: Record<string, unknown>;
  evidence_source: CustomerProfileEvidenceRecord["evidenceSource"];
  verification_status: CustomerProfileEvidenceRecord["verificationStatus"];
  evidence_metadata: Record<string, unknown>;
  created_at: Date | string;
}

interface TransactionDefinitionRow {
  id: string;
  transaction_key: string;
  label: string;
  description: string;
  status: TransactionDefinitionRecord["status"];
  owning_agency: string;
}

interface FeatureFlagRow {
  id: string;
  flag_key: string;
  description: string;
  enabled: boolean;
  metadata: Record<string, unknown>;
}

interface TransactionCatalogueRow extends TransactionDefinitionRow {
  schema_version: string;
  schema_json: Record<string, unknown>;
  feature_flag_key: string;
  feature_enabled: boolean;
}

interface ServiceRequestRow {
  id: string;
  customer_id: string;
  transaction_definition_id: string;
  reference_number: string;
  status: ServiceRequestRecord["status"];
  payload: Record<string, unknown>;
  transaction_key?: string;
}

interface ServiceRequestDraftRow {
  id: string;
  customer_id: string;
  transaction_definition_id: string;
  transaction_key?: string;
  current_step: string;
  payload: Record<string, unknown>;
  created_at: Date | string;
  updated_at: Date | string;
}

interface ServiceRequestEventRow {
  id: string;
  service_request_id: string;
  event_type: string;
  event_payload: Record<string, unknown>;
  created_at: Date | string;
}

interface SupportingDocumentRow {
  id: string;
  customer_id: string;
  service_request_draft_id?: string | null;
  service_request_id?: string | null;
  category: string;
  file_name: string;
  file_extension: string;
  mime_type: string;
  size_bytes: number;
  storage_key: string;
  upload_status: string;
  scan_status: string;
  retention_policy: string;
  metadata: Record<string, unknown>;
  created_at: Date | string;
  updated_at: Date | string;
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

  async listCustomerProfileAttributes(customerId: string): Promise<CustomerProfileAttributeRecord[]> {
    const result = await this.database.query<CustomerProfileAttributeRow>(
      `
        SELECT id, customer_id, attribute_key, attribute_value
        FROM customer_profile_attributes
        WHERE customer_id = $1
        ORDER BY attribute_key ASC
      `,
      [customerId]
    );

    return result.rows.map(mapCustomerProfileAttribute);
  }

  async listCustomerProfileAttributesByKeys(input: {
    customerId: string;
    attributeKeys: string[];
  }): Promise<CustomerProfileAttributeRecord[]> {
    if (input.attributeKeys.length === 0) {
      return [];
    }

    const result = await this.database.query<CustomerProfileAttributeRow>(
      `
        SELECT id, customer_id, attribute_key, attribute_value
        FROM customer_profile_attributes
        WHERE customer_id = $1
          AND attribute_key = ANY($2::text[])
        ORDER BY attribute_key ASC
      `,
      [input.customerId, input.attributeKeys]
    );

    return result.rows.map(mapCustomerProfileAttribute);
  }

  async listTransactionDefinitions(): Promise<TransactionDefinitionRecord[]> {
    const result = await this.database.query<TransactionDefinitionRow>(`
      SELECT id, transaction_key, label, description, status, owning_agency
      FROM transaction_definitions
      ORDER BY transaction_key ASC
    `);

    return result.rows.map(mapTransactionDefinition);
  }

  async listFeatureFlags(): Promise<FeatureFlagRecord[]> {
    const result = await this.database.query<FeatureFlagRow>(`
      SELECT id, flag_key, description, enabled, metadata
      FROM feature_flags
      ORDER BY flag_key ASC
    `);

    return result.rows.map(mapFeatureFlag);
  }

  async listEnabledTransactionCatalogue(): Promise<TransactionCatalogueRecord[]> {
    const result = await this.database.query<TransactionCatalogueRow>(`
      SELECT
        td.id,
        td.transaction_key,
        td.label,
        td.description,
        td.status,
        td.owning_agency,
        ts.schema_version,
        ts.schema_json,
        ff.flag_key AS feature_flag_key,
        ff.enabled AS feature_enabled
      FROM transaction_definitions td
      INNER JOIN transaction_schemas ts
        ON ts.transaction_definition_id = td.id
      INNER JOIN feature_flags ff
        ON ff.flag_key = 'transaction.' || td.transaction_key || '.enabled'
      WHERE td.status = 'ENABLED'
        AND ff.enabled = true
      ORDER BY td.transaction_key ASC
    `);

    return result.rows.map(mapTransactionCatalogue);
  }

  async getTransactionCatalogueEntry(transactionKey: string): Promise<TransactionCatalogueRecord | undefined> {
    const result = await this.database.query<TransactionCatalogueRow>(
      `
        SELECT
          td.id,
          td.transaction_key,
          td.label,
          td.description,
          td.status,
          td.owning_agency,
          ts.schema_version,
          ts.schema_json,
          ff.flag_key AS feature_flag_key,
          ff.enabled AS feature_enabled
        FROM transaction_definitions td
        LEFT JOIN transaction_schemas ts
          ON ts.transaction_definition_id = td.id
        LEFT JOIN feature_flags ff
          ON ff.flag_key = 'transaction.' || td.transaction_key || '.enabled'
        WHERE td.transaction_key = $1
        ORDER BY ts.created_at DESC
        LIMIT 1
      `,
      [transactionKey]
    );

    return result.rows[0] ? mapTransactionCatalogue(result.rows[0]) : undefined;
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

  async createServiceRequestDraft(input: {
    customerId: string;
    transactionDefinitionId: string;
    currentStep: string;
    payload?: Record<string, unknown>;
  }): Promise<ServiceRequestDraftRecord> {
    const result = await this.database.query<ServiceRequestDraftRow>(
      `
        INSERT INTO service_request_drafts (
          customer_id,
          transaction_definition_id,
          current_step,
          payload
        )
        VALUES ($1, $2, $3, $4::jsonb)
        RETURNING id, customer_id, transaction_definition_id, current_step, payload, created_at, updated_at
      `,
      [
        input.customerId,
        input.transactionDefinitionId,
        input.currentStep,
        JSON.stringify(input.payload ?? {})
      ]
    );

    return mapServiceRequestDraft(result.rows[0]);
  }

  async updateServiceRequestDraftForCustomer(input: {
    draftId: string;
    customerId: string;
    currentStep: string;
    payload: Record<string, unknown>;
  }): Promise<ServiceRequestDraftRecord | undefined> {
    const result = await this.database.query<ServiceRequestDraftRow>(
      `
        UPDATE service_request_drafts
        SET current_step = $3,
            payload = $4::jsonb,
            updated_at = now()
        WHERE id = $1
          AND customer_id = $2
        RETURNING id, customer_id, transaction_definition_id, current_step, payload, created_at, updated_at
      `,
      [
        input.draftId,
        input.customerId,
        input.currentStep,
        JSON.stringify(input.payload)
      ]
    );

    return result.rows[0] ? mapServiceRequestDraft(result.rows[0]) : undefined;
  }

  async getServiceRequestDraftForCustomer(input: {
    draftId: string;
    customerId: string;
  }): Promise<ServiceRequestDraftRecord | undefined> {
    const result = await this.database.query<ServiceRequestDraftRow>(
      `
        SELECT
          srd.id,
          srd.customer_id,
          srd.transaction_definition_id,
          td.transaction_key,
          srd.current_step,
          srd.payload,
          srd.created_at,
          srd.updated_at
        FROM service_request_drafts srd
        INNER JOIN transaction_definitions td
          ON td.id = srd.transaction_definition_id
        WHERE srd.id = $1
          AND srd.customer_id = $2
      `,
      [input.draftId, input.customerId]
    );

    return result.rows[0] ? mapServiceRequestDraft(result.rows[0]) : undefined;
  }

  async listServiceRequestDraftsForCustomer(customerId: string): Promise<ServiceRequestDraftRecord[]> {
    const result = await this.database.query<ServiceRequestDraftRow>(
      `
        SELECT
          srd.id,
          srd.customer_id,
          srd.transaction_definition_id,
          td.transaction_key,
          srd.current_step,
          srd.payload,
          srd.created_at,
          srd.updated_at
        FROM service_request_drafts srd
        INNER JOIN transaction_definitions td
          ON td.id = srd.transaction_definition_id
        WHERE srd.customer_id = $1
        ORDER BY srd.updated_at DESC
      `,
      [customerId]
    );

    return result.rows.map(mapServiceRequestDraft);
  }

  async listServiceRequestsForCustomer(customerId: string): Promise<ServiceRequestRecord[]> {
    const result = await this.database.query<ServiceRequestRow>(
      `
        SELECT
          sr.id,
          sr.customer_id,
          sr.transaction_definition_id,
          sr.reference_number,
          sr.status,
          sr.payload,
          td.transaction_key
        FROM service_requests sr
        INNER JOIN transaction_definitions td
          ON td.id = sr.transaction_definition_id
        WHERE sr.customer_id = $1
        ORDER BY sr.created_at DESC
      `,
      [customerId]
    );

    return result.rows.map(mapServiceRequest);
  }

  async getServiceRequestByReference(referenceNumber: string): Promise<ServiceRequestRecord | undefined> {
    const result = await this.database.query<ServiceRequestRow>(
      `
        SELECT
          sr.id,
          sr.customer_id,
          sr.transaction_definition_id,
          sr.reference_number,
          sr.status,
          sr.payload,
          td.transaction_key
        FROM service_requests sr
        INNER JOIN transaction_definitions td
          ON td.id = sr.transaction_definition_id
        WHERE sr.reference_number = $1
      `,
      [referenceNumber]
    );

    return result.rows[0] ? mapServiceRequest(result.rows[0]) : undefined;
  }

  async getServiceRequestByReferenceForCustomer(input: {
    customerId: string;
    referenceNumber: string;
  }): Promise<ServiceRequestRecord | undefined> {
    const result = await this.database.query<ServiceRequestRow>(
      `
        SELECT
          sr.id,
          sr.customer_id,
          sr.transaction_definition_id,
          sr.reference_number,
          sr.status,
          sr.payload,
          td.transaction_key
        FROM service_requests sr
        INNER JOIN transaction_definitions td
          ON td.id = sr.transaction_definition_id
        WHERE sr.reference_number = $1
          AND sr.customer_id = $2
      `,
      [input.referenceNumber, input.customerId]
    );

    return result.rows[0] ? mapServiceRequest(result.rows[0]) : undefined;
  }

  async listActivityLogs(serviceRequestId: string): Promise<ServiceRequestEventRecord[]> {
    const result = await this.database.query<ServiceRequestEventRow>(
      `
        SELECT id, service_request_id, event_type, event_payload, created_at
        FROM service_request_events
        WHERE service_request_id = $1
        ORDER BY created_at ASC
      `,
      [serviceRequestId]
    );

    return result.rows.map(mapServiceRequestEvent);
  }

  async createServiceRequestEvent(input: {
    serviceRequestId: string;
    eventType: string;
    eventPayload?: Record<string, unknown>;
  }): Promise<ServiceRequestEventRecord> {
    const result = await this.database.query<ServiceRequestEventRow>(
      `
        INSERT INTO service_request_events (
          service_request_id,
          event_type,
          event_payload
        )
        VALUES ($1, $2, $3::jsonb)
        RETURNING id, service_request_id, event_type, event_payload, created_at
      `,
      [
        input.serviceRequestId,
        input.eventType,
        JSON.stringify(input.eventPayload ?? {})
      ]
    );

    return mapServiceRequestEvent(result.rows[0]);
  }

  async createCustomerProfileEvidence(input: {
    serviceRequestId: string;
    customerProfileAttributeId?: string;
    attributeKey: string;
    attributeValue: Record<string, unknown>;
    verificationStatus: CustomerProfileEvidenceRecord["verificationStatus"];
    evidenceMetadata?: Record<string, unknown>;
  }): Promise<CustomerProfileEvidenceRecord> {
    const result = await this.database.query<CustomerProfileEvidenceRow>(
      `
        INSERT INTO customer_profile_evidence (
          service_request_id,
          customer_profile_attribute_id,
          attribute_key,
          attribute_value,
          evidence_source,
          verification_status,
          evidence_metadata
        )
        VALUES ($1, $2, $3, $4::jsonb, 'SIMULATED_PROFILE', $5, $6::jsonb)
        RETURNING
          id,
          service_request_id,
          customer_profile_attribute_id,
          attribute_key,
          attribute_value,
          evidence_source,
          verification_status,
          evidence_metadata,
          created_at
      `,
      [
        input.serviceRequestId,
        input.customerProfileAttributeId ?? null,
        input.attributeKey,
        JSON.stringify(input.attributeValue),
        input.verificationStatus,
        JSON.stringify(input.evidenceMetadata ?? {})
      ]
    );

    return mapCustomerProfileEvidence(result.rows[0]);
  }

  async listCustomerProfileEvidence(serviceRequestId: string): Promise<CustomerProfileEvidenceRecord[]> {
    const result = await this.database.query<CustomerProfileEvidenceRow>(
      `
        SELECT
          id,
          service_request_id,
          customer_profile_attribute_id,
          attribute_key,
          attribute_value,
          evidence_source,
          verification_status,
          evidence_metadata,
          created_at
        FROM customer_profile_evidence
        WHERE service_request_id = $1
        ORDER BY attribute_key ASC
      `,
      [serviceRequestId]
    );

    return result.rows.map(mapCustomerProfileEvidence);
  }

  async createSupportingDocument(input: {
    customerId: string;
    serviceRequestDraftId?: string;
    serviceRequestId?: string;
    category: string;
    fileName: string;
    fileExtension: string;
    mimeType: string;
    sizeBytes: number;
    storageKey: string;
    uploadStatus: string;
    scanStatus: string;
    retentionPolicy: string;
    metadata?: Record<string, unknown>;
  }): Promise<SupportingDocumentRecord> {
    const result = await this.database.query<SupportingDocumentRow>(
      `
        INSERT INTO supporting_documents (
          customer_id,
          service_request_draft_id,
          service_request_id,
          category,
          file_name,
          file_extension,
          mime_type,
          size_bytes,
          storage_key,
          upload_status,
          scan_status,
          retention_policy,
          metadata
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13::jsonb)
        RETURNING
          id,
          customer_id,
          service_request_draft_id,
          service_request_id,
          category,
          file_name,
          file_extension,
          mime_type,
          size_bytes,
          storage_key,
          upload_status,
          scan_status,
          retention_policy,
          metadata,
          created_at,
          updated_at
      `,
      [
        input.customerId,
        input.serviceRequestDraftId ?? null,
        input.serviceRequestId ?? null,
        input.category,
        input.fileName,
        input.fileExtension,
        input.mimeType,
        input.sizeBytes,
        input.storageKey,
        input.uploadStatus,
        input.scanStatus,
        input.retentionPolicy,
        JSON.stringify(input.metadata ?? {})
      ]
    );

    return mapSupportingDocument(result.rows[0]);
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

function mapCustomerProfileAttribute(row: CustomerProfileAttributeRow): CustomerProfileAttributeRecord {
  return {
    id: row.id,
    customerId: row.customer_id,
    attributeKey: row.attribute_key,
    attributeValue: row.attribute_value
  };
}

function mapCustomerProfileEvidence(row: CustomerProfileEvidenceRow): CustomerProfileEvidenceRecord {
  return {
    id: row.id,
    serviceRequestId: row.service_request_id,
    customerProfileAttributeId: row.customer_profile_attribute_id ?? undefined,
    attributeKey: row.attribute_key,
    attributeValue: row.attribute_value,
    evidenceSource: row.evidence_source,
    verificationStatus: row.verification_status,
    evidenceMetadata: row.evidence_metadata,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at
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

function mapFeatureFlag(row: FeatureFlagRow): FeatureFlagRecord {
  return {
    id: row.id,
    flagKey: row.flag_key,
    description: row.description,
    enabled: row.enabled,
    metadata: row.metadata
  };
}

function mapTransactionCatalogue(row: TransactionCatalogueRow): TransactionCatalogueRecord {
  return {
    ...mapTransactionDefinition(row),
    schemaVersion: row.schema_version,
    schema: row.schema_json,
    featureFlagKey: row.feature_flag_key,
    featureEnabled: row.feature_enabled
  };
}

function mapServiceRequest(row: ServiceRequestRow): ServiceRequestRecord {
  return {
    id: row.id,
    customerId: row.customer_id,
    transactionDefinitionId: row.transaction_definition_id,
    referenceNumber: row.reference_number,
    status: row.status,
    payload: row.payload,
    transactionKey: row.transaction_key
  };
}

function mapServiceRequestDraft(row: ServiceRequestDraftRow): ServiceRequestDraftRecord {
  return {
    id: row.id,
    customerId: row.customer_id,
    transactionDefinitionId: row.transaction_definition_id,
    transactionKey: row.transaction_key,
    currentStep: row.current_step,
    payload: row.payload,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
    updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : row.updated_at
  };
}

function mapServiceRequestEvent(row: ServiceRequestEventRow): ServiceRequestEventRecord {
  return {
    id: row.id,
    serviceRequestId: row.service_request_id,
    eventType: row.event_type,
    eventPayload: row.event_payload,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at
  };
}

function mapSupportingDocument(row: SupportingDocumentRow): SupportingDocumentRecord {
  return {
    id: row.id,
    customerId: row.customer_id,
    serviceRequestDraftId: row.service_request_draft_id ?? undefined,
    serviceRequestId: row.service_request_id ?? undefined,
    category: row.category,
    fileName: row.file_name,
    fileExtension: row.file_extension,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    storageKey: row.storage_key,
    uploadStatus: row.upload_status,
    scanStatus: row.scan_status,
    retentionPolicy: row.retention_policy,
    metadata: row.metadata,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
    updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : row.updated_at
  };
}
