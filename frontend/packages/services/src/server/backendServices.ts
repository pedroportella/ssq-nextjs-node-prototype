import "server-only";

import { BackendClientError, executeBackendGraphql } from "./backendClient";
import { createBackendHeaders, createCorrelationId } from "./correlation";
import { resolveFrontendPublicUrlConfig } from "./publicUrls";
import { createPrototypeAppSummary } from "../index";

import type {
  PrototypeActivityEntry,
  PrototypeAppKey,
  PrototypeDashboardSummaryData,
  PrototypeDraftMutationResult,
  PrototypeDraftSummary,
  PrototypeProfileSummary,
  PrototypeServiceCatalogueEntry,
  PrototypeSupportingDocumentUploadInput,
  PrototypeSupportingDocumentUploadResult,
  PrototypeSubmissionSummaryDownload,
  PrototypeSubmissionSummaryMetadata,
  PrototypeSubmitResult,
  PrototypeSubmittedRequestSummary,
  PrototypeUploadedDocument,
  PrototypeUploadCategory,
  PrototypeUploadPolicy,
  PrototypeValidationError,
  PrototypeWorkflowData,
  ServiceRequestStatus
} from "../index";
import type { AppShellData } from "./appServices";
import type { BackendClientConfig, BackendGraphqlResponse } from "./backendClient";
import type { FrontendRuntimeConfig } from "./runtimeConfig";

type TransactionAppKey = Exclude<PrototypeAppKey, "dashboard">;

type BackendServiceRequestStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "ACTION_REQUIRED"
  | "COMPLETED"
  | "WITHDRAWN";

interface BackendCustomerProfile {
  customer: {
    email: string;
    familyName: string;
    givenName: string;
  };
  attributes: Array<{
    key: string;
    value: Record<string, unknown>;
  }>;
}

interface BackendTransactionCatalogueEntry {
  definition: {
    description: string;
    key: string;
    label: string;
    status: "ENABLED" | "DISABLED" | string;
  };
  featureEnabled: boolean;
}

interface BackendServiceRequestDraft {
  id: string;
  currentStep: string;
  payload: Record<string, unknown>;
  transactionKey?: string | null;
  updatedAt: string;
}

interface BackendServiceRequest {
  id: string;
  payload: Record<string, unknown>;
  referenceNumber: string;
  status: BackendServiceRequestStatus | string;
  transactionKey?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface BackendSupportingDocument {
  category: string;
  fileName: string;
  metadata?: {
    personKey?: unknown;
  };
  mimeType: string;
  scanStatus: string;
  sizeBytes: number;
  uploadStatus: string;
}

interface BackendUploadPolicy {
  allowedCategories?: string[];
  allowedMimeTypes?: string[];
  defaultPersonKey?: string;
  maxFilesPerPerson?: number;
  maxSizeBytes?: number;
  maxTotalSizeBytesPerPerson?: number;
}

interface BackendSupportingDocumentUploadResponse {
  document?: BackendSupportingDocument;
  error?: {
    code: string;
    message: string;
  };
  fieldErrors?: BackendFieldValidationError[];
  ok: boolean;
  policy?: BackendUploadPolicy;
}

interface BackendSubmissionSummary {
  contentType: string;
  fileName: string;
}

interface BackendMutationError {
  code: string;
  message: string;
}

interface BackendFieldValidationError {
  field: string;
  message: string;
}

const backendUploadCategoryValues = [
  "concession",
  "identity",
  "income",
  "other",
  "residency",
  "supporting-evidence",
  "supporting-document"
];

const backendUploadCategoryHints: Record<string, string> = {
  concession: "Pension, concession or card evidence.",
  identity: "Documents that prove the applicant's name or age.",
  income: "Payslips, statements or other income evidence.",
  residency: "Documents that show the applicant lives in Queensland.",
  "supporting-evidence": "Service-specific documents requested during assessment.",
  "supporting-document": "Other documents that support this request."
};

const backendUploadPolicy: PrototypeUploadPolicy = {
  acceptedFileTypes: ["application/pdf", "image/jpeg", "image/png"],
  allowedCategories: createUploadCategories(backendUploadCategoryValues),
  defaultPersonKey: "applicant",
  maxFileSizeBytes: 5 * 1024 * 1024,
  maxFilesPerPerson: 5,
  maxTotalSizeBytesPerPerson: 10 * 1024 * 1024,
  rejectedExample: {
    fieldPath: "supportingDocuments[0].file",
    message: "Upload a PDF, JPG or PNG file under 5 MB."
  }
};

const DASHBOARD_SUMMARY_QUERY = /* GraphQL */ `
  query FrontendDashboardSummary {
    customerProfile {
      customer {
        email
        familyName
        givenName
      }
      attributes {
        key
        value
      }
    }
    transactionCatalogue {
      definition {
        key
        label
        description
        status
      }
      featureEnabled
    }
    serviceRequestDrafts {
      id
      currentStep
      payload
      transactionKey
      updatedAt
    }
    serviceRequests {
      id
      payload
      referenceNumber
      status
      transactionKey
      createdAt
      updatedAt
    }
  }
`;

const CREATE_DRAFT_MUTATION = /* GraphQL */ `
  mutation FrontendCreateDraft($input: CreateServiceRequestDraftInput!) {
    createServiceRequestDraft(input: $input) {
      ok
      draft {
        id
        currentStep
        payload
        transactionKey
        updatedAt
      }
      error {
        code
        message
      }
    }
  }
`;

const UPDATE_DRAFT_MUTATION = /* GraphQL */ `
  mutation FrontendUpdateDraft($input: UpdateServiceRequestDraftInput!) {
    updateServiceRequestDraft(input: $input) {
      ok
      draft {
        id
        currentStep
        payload
        transactionKey
        updatedAt
      }
      error {
        code
        message
      }
    }
  }
`;

const SUBMIT_DRAFT_MUTATION = /* GraphQL */ `
  mutation FrontendSubmitDraft($input: SubmitServiceRequestInput!) {
    submitServiceRequest(input: $input) {
      ok
      serviceRequest {
        id
        payload
        referenceNumber
        status
        transactionKey
        createdAt
        updatedAt
      }
      error {
        code
        message
      }
      fieldErrors {
        field
        message
      }
    }
  }
`;

const SUBMISSION_SUMMARY_QUERY = /* GraphQL */ `
  query FrontendSubmissionSummary($referenceNumber: String!) {
    submissionSummary(referenceNumber: $referenceNumber) {
      contentType
      fileName
    }
  }
`;

const SUPPORTING_DOCUMENTS_QUERY = /* GraphQL */ `
  query FrontendSupportingDocuments($referenceNumber: String) {
    supportingDocuments(referenceNumber: $referenceNumber) {
      category
      fileName
      mimeType
      sizeBytes
      uploadStatus
      scanStatus
    }
  }
`;

export function createBackendAppShellData(key: PrototypeAppKey): AppShellData {
  return {
    app: createPrototypeAppSummary(key),
    backendBoundary: "server-only",
    dataSource: "backend"
  };
}

export async function getBackendDashboardSummaryData(
  config: FrontendRuntimeConfig
): Promise<PrototypeDashboardSummaryData> {
  const data = await executeBackendData<{
    customerProfile: BackendCustomerProfile | null;
    serviceRequestDrafts: BackendServiceRequestDraft[];
    serviceRequests: BackendServiceRequest[];
    transactionCatalogue: BackendTransactionCatalogueEntry[];
  }>({
    config,
    query: DASHBOARD_SUMMARY_QUERY
  });

  return createDashboardSummary(data);
}

export async function getBackendWorkflowData(
  appKey: TransactionAppKey,
  config: FrontendRuntimeConfig
): Promise<PrototypeWorkflowData> {
  const summary = await getBackendDashboardSummaryData(config);
  const draft = summary.drafts.find((candidate) => candidate.appKey === appKey) ?? createPendingDraftSummary(appKey);
  const submittedRequest =
    summary.submittedRequests.find((candidate) => candidate.appKey === appKey) ??
    createPendingSubmittedRequestSummary(appKey);
  const supportingDocuments = submittedRequest.referenceNumber.startsWith("SSQ-")
    ? await getBackendUploadedDocuments(appKey, config)
    : [];

  return {
    activity: summary.activity.filter((entry) =>
      entry.description.toLowerCase().includes(createPrototypeAppSummary(appKey).label.toLowerCase()) ||
      entry.description.includes(submittedRequest.referenceNumber)
    ),
    app: createPrototypeAppSummary(appKey),
    draft,
    profile: summary.profile,
    submittedRequest,
    supportingDocuments,
    uploadPolicy: backendUploadPolicy,
    validationErrors: []
  };
}

export async function createBackendTransactionDraft(
  appKey: TransactionAppKey,
  config: FrontendRuntimeConfig
): Promise<PrototypeDraftMutationResult> {
  const draft = await createBackendDraft(appKey, createValidPayload(appKey), config);
  const draftSummary = mapDraftSummary(draft, appKey);

  return {
    draft: requireMappedValue(draftSummary, "Backend draft did not include a supported transaction key."),
    validationErrors: []
  };
}

export async function updateBackendDraftWithValidationError(
  appKey: TransactionAppKey,
  config: FrontendRuntimeConfig
): Promise<PrototypeDraftMutationResult> {
  const draft = await createBackendDraft(appKey, createValidPayload(appKey), config);
  const updatedDraft = await updateBackendDraft({
    appKey,
    config,
    draftId: draft.id,
    payload: createInvalidPayload(appKey)
  });
  const submitResult = await submitBackendDraft(updatedDraft.id, config);
  const draftSummary = mapDraftSummary(updatedDraft, appKey);

  return {
    draft: requireMappedValue(draftSummary, "Backend draft did not include a supported transaction key."),
    validationErrors: submitResult.ok ? [] : mapValidationErrors(appKey, submitResult.fieldErrors)
  };
}

export async function submitBackendTransactionDraft(
  appKey: TransactionAppKey,
  config: FrontendRuntimeConfig
): Promise<PrototypeSubmitResult> {
  const draft = await createBackendDraft(appKey, createValidPayload(appKey), config);
  const submitResult = await submitBackendDraft(draft.id, config);

  if (!submitResult.ok || !submitResult.serviceRequest) {
    throw new BackendClientError(
      submitResult.error?.message ?? "Backend draft submission failed.",
      createCorrelationId()
    );
  }

  const submittedRequest = mapSubmittedRequestSummary(submitResult.serviceRequest, appKey);
  const mappedSubmittedRequest = requireMappedValue(
    submittedRequest,
    "Backend service request did not include a supported transaction key."
  );
  const summary = await getBackendSubmissionSummaryMetadata(mappedSubmittedRequest.referenceNumber, config);

  return {
    activity: [
      {
        at: draft.updatedAt,
        description: `${createPrototypeAppSummary(appKey).label} draft saved`,
        status: "DRAFT"
      },
      {
        at: mappedSubmittedRequest.submittedAt,
        description: `${mappedSubmittedRequest.referenceNumber} submitted`,
        status: mappedSubmittedRequest.status
      }
    ],
    referenceNumber: mappedSubmittedRequest.referenceNumber,
    status: mappedSubmittedRequest.status,
    summary
  };
}

export async function getBackendSupportingDocumentUploadPolicy(): Promise<PrototypeUploadPolicy> {
  return backendUploadPolicy;
}

export async function recordBackendSupportingDocumentUploadMetadata(
  input: PrototypeSupportingDocumentUploadInput,
  config: FrontendRuntimeConfig
): Promise<PrototypeSupportingDocumentUploadResult> {
  const backendConfig = toBackendClientConfig(config);
  const correlationId = createCorrelationId();
  const response = await fetch(`${backendConfig.backendUrl}/uploads/supporting-documents`, {
    body: JSON.stringify(input),
    cache: "no-store",
    headers: createBackendHeaders(correlationId),
    method: "POST"
  });
  const payload = await response.json() as BackendSupportingDocumentUploadResponse;
  const policy = mapUploadPolicy(payload.policy);

  if (!response.ok || !payload.ok) {
    return {
      error: payload.error ?? {
        code: response.status === 404 ? "TARGET_NOT_FOUND" : "UPLOAD_FAILED",
        message: "Supporting document metadata could not be recorded."
      },
      fieldErrors: mapValidationErrorsFromBackendFields(payload.fieldErrors ?? []),
      ok: false,
      policy
    };
  }

  return {
    document: payload.document ? mapUploadedDocument(payload.document) : undefined,
    fieldErrors: [],
    ok: true,
    policy
  };
}

export async function getBackendUploadedDocuments(
  appKey: TransactionAppKey,
  config: FrontendRuntimeConfig
): Promise<PrototypeUploadedDocument[]> {
  const summary = await getBackendDashboardSummaryData(config);
  const submittedRequest = summary.submittedRequests.find((candidate) => candidate.appKey === appKey);

  if (!submittedRequest) {
    return [];
  }

  const data = await executeBackendData<{
    supportingDocuments: BackendSupportingDocument[];
  }, { referenceNumber: string }>({
    config,
    query: SUPPORTING_DOCUMENTS_QUERY,
    variables: {
      referenceNumber: submittedRequest.referenceNumber
    }
  });

  return data.supportingDocuments.map(mapUploadedDocument);
}

export async function getBackendSubmissionSummaryDownload(
  _appKey: TransactionAppKey,
  referenceNumber: string,
  config: FrontendRuntimeConfig
): Promise<PrototypeSubmissionSummaryDownload> {
  const backendConfig = toBackendClientConfig(config);
  const correlationId = createCorrelationId();
  const response = await fetch(`${backendConfig.backendUrl}/service-requests/${referenceNumber}/summary/download`, {
    cache: "no-store",
    headers: createBackendHeaders(correlationId)
  });

  if (!response.ok) {
    throw new BackendClientError("Backend submission summary download failed.", correlationId, response.status);
  }

  return {
    body: await response.text(),
    contentType: "text/plain",
    filename: extractFilename(response.headers.get("content-disposition")) ?? `${referenceNumber.toLowerCase()}-summary.txt`,
    referenceNumber
  };
}

function createDashboardSummary(data: {
  customerProfile: BackendCustomerProfile | null;
  serviceRequestDrafts: BackendServiceRequestDraft[];
  serviceRequests: BackendServiceRequest[];
  transactionCatalogue: BackendTransactionCatalogueEntry[];
}): PrototypeDashboardSummaryData {
  const publicUrls = resolveFrontendPublicUrlConfig();
  const availableServices = data.transactionCatalogue
    .map((entry) => mapCatalogueEntry(entry, publicUrls))
    .filter((entry): entry is PrototypeServiceCatalogueEntry => Boolean(entry));
  const drafts = data.serviceRequestDrafts
    .map((draft) => mapDraftSummary(draft))
    .filter((draft): draft is PrototypeDraftSummary => Boolean(draft));
  const submittedRequests = data.serviceRequests
    .filter((request) => request.status !== "DRAFT")
    .map((request) => mapSubmittedRequestSummary(request))
    .filter((request): request is PrototypeSubmittedRequestSummary => Boolean(request));

  return {
    activity: createActivity(drafts, submittedRequests),
    availableServices,
    drafts,
    profile: mapProfileSummary(data.customerProfile),
    submittedRequests
  };
}

function mapCatalogueEntry(
  entry: BackendTransactionCatalogueEntry,
  publicUrls: Record<TransactionAppKey, string>
): PrototypeServiceCatalogueEntry | undefined {
  if (!isTransactionAppKey(entry.definition.key)) {
    return undefined;
  }

  return {
    appKey: entry.definition.key,
    description: entry.definition.description,
    href: publicUrls[entry.definition.key],
    label: entry.definition.label,
    status: entry.featureEnabled && entry.definition.status === "ENABLED" ? "available" : "coming-soon"
  };
}

function mapProfileSummary(profile: BackendCustomerProfile | null): PrototypeProfileSummary {
  if (!profile) {
    return {
      displayName: "SSQ customer",
      email: "",
      identityStrength: "basic"
    };
  }

  return {
    displayName: `${profile.customer.givenName} ${profile.customer.familyName}`.trim(),
    email: profile.customer.email,
    identityStrength: profile.attributes.some((attribute) => attribute.value.verified === true) ? "verified" : "basic"
  };
}

function mapDraftSummary(
  draft: BackendServiceRequestDraft,
  fallbackAppKey?: TransactionAppKey
): PrototypeDraftSummary | undefined {
  const appKey = isTransactionAppKey(draft.transactionKey) ? draft.transactionKey : fallbackAppKey;

  if (!appKey) {
    return undefined;
  }

  return {
    appKey,
    draftId: draft.id,
    lastUpdated: draft.updatedAt,
    status: "DRAFT",
    title: createPrototypeAppSummary(appKey).label
  };
}

function mapSubmittedRequestSummary(
  request: BackendServiceRequest,
  fallbackAppKey?: TransactionAppKey
): PrototypeSubmittedRequestSummary | undefined {
  const appKey = isTransactionAppKey(request.transactionKey) ? request.transactionKey : fallbackAppKey;

  if (!appKey) {
    return undefined;
  }

  return {
    appKey,
    referenceNumber: request.referenceNumber,
    status: mapServiceRequestStatus(request.status),
    submittedAt: request.createdAt,
    title: createPrototypeAppSummary(appKey).label
  };
}

function createActivity(
  drafts: PrototypeDraftSummary[],
  submittedRequests: PrototypeSubmittedRequestSummary[]
): PrototypeActivityEntry[] {
  return [
    ...drafts.map((draft) => ({
      at: draft.lastUpdated,
      description: `${draft.title} draft saved`,
      status: "DRAFT" as const
    })),
    ...submittedRequests.map((request) => ({
      at: request.submittedAt,
      description: `${request.referenceNumber} submitted`,
      status: request.status
    }))
  ].sort((left, right) => new Date(left.at).getTime() - new Date(right.at).getTime());
}

function mapUploadedDocument(document: BackendSupportingDocument): PrototypeUploadedDocument {
  const rejectedScanStatuses = new Set(["QUARANTINED", "REJECTED"]);

  return {
    category: formatDocumentCategory(document.category),
    fileName: document.fileName,
    message: document.uploadStatus === "REJECTED" ? backendUploadPolicy.rejectedExample.message : undefined,
    mimeType: document.mimeType,
    personKey: typeof document.metadata?.personKey === "string" ? document.metadata.personKey : undefined,
    sizeBytes: document.sizeBytes,
    status: document.uploadStatus === "REJECTED" || rejectedScanStatuses.has(document.scanStatus) ? "rejected" : "uploaded"
  };
}

function mapUploadPolicy(policy: BackendUploadPolicy | undefined): PrototypeUploadPolicy {
  const maxFileSizeBytes = policy?.maxSizeBytes ?? backendUploadPolicy.maxFileSizeBytes;

  return {
    acceptedFileTypes: policy?.allowedMimeTypes ?? backendUploadPolicy.acceptedFileTypes,
    allowedCategories: policy?.allowedCategories ? createUploadCategories(policy.allowedCategories) : backendUploadPolicy.allowedCategories,
    defaultPersonKey: policy?.defaultPersonKey ?? backendUploadPolicy.defaultPersonKey,
    maxFileSizeBytes,
    maxFilesPerPerson: policy?.maxFilesPerPerson ?? backendUploadPolicy.maxFilesPerPerson,
    maxTotalSizeBytesPerPerson: policy?.maxTotalSizeBytesPerPerson ?? backendUploadPolicy.maxTotalSizeBytesPerPerson,
    rejectedExample: {
      fieldPath: backendUploadPolicy.rejectedExample.fieldPath,
      message: `Upload a PDF, JPG or PNG file under ${Math.round(maxFileSizeBytes / (1024 * 1024))} MB.`
    }
  };
}

async function createBackendDraft(
  appKey: TransactionAppKey,
  payload: Record<string, unknown>,
  config: FrontendRuntimeConfig
): Promise<BackendServiceRequestDraft> {
  const data = await executeBackendData<{
    createServiceRequestDraft: {
      draft: BackendServiceRequestDraft | null;
      error: BackendMutationError | null;
      ok: boolean;
    };
  }, { input: { currentStep: string; payload: Record<string, unknown>; transactionKey: TransactionAppKey } }>({
    config,
    query: CREATE_DRAFT_MUTATION,
    variables: {
      input: {
        currentStep: "review",
        payload,
        transactionKey: appKey
      }
    }
  });
  const result = data.createServiceRequestDraft;

  if (!result.ok || !result.draft) {
    throw new BackendClientError(result.error?.message ?? "Backend draft creation failed.", createCorrelationId());
  }

  return result.draft;
}

async function updateBackendDraft(input: {
  appKey: TransactionAppKey;
  config: FrontendRuntimeConfig;
  draftId: string;
  payload: Record<string, unknown>;
}): Promise<BackendServiceRequestDraft> {
  const data = await executeBackendData<{
    updateServiceRequestDraft: {
      draft: BackendServiceRequestDraft | null;
      error: BackendMutationError | null;
      ok: boolean;
    };
  }, { input: { currentStep: string; draftId: string; payload: Record<string, unknown> } }>({
    config: input.config,
    query: UPDATE_DRAFT_MUTATION,
    variables: {
      input: {
        currentStep: "review",
        draftId: input.draftId,
        payload: input.payload
      }
    }
  });
  const result = data.updateServiceRequestDraft;

  if (!result.ok || !result.draft) {
    throw new BackendClientError(result.error?.message ?? "Backend draft update failed.", createCorrelationId());
  }

  return {
    ...result.draft,
    transactionKey: result.draft.transactionKey ?? input.appKey
  };
}

async function submitBackendDraft(
  draftId: string,
  config: FrontendRuntimeConfig
): Promise<{
  error: BackendMutationError | null;
  fieldErrors: BackendFieldValidationError[];
  ok: boolean;
  serviceRequest: BackendServiceRequest | null;
}> {
  const data = await executeBackendData<{
    submitServiceRequest: {
      error: BackendMutationError | null;
      fieldErrors: BackendFieldValidationError[];
      ok: boolean;
      serviceRequest: BackendServiceRequest | null;
    };
  }, { input: { draftId: string } }>({
    config,
    query: SUBMIT_DRAFT_MUTATION,
    variables: {
      input: {
        draftId
      }
    }
  });

  return data.submitServiceRequest;
}

async function getBackendSubmissionSummaryMetadata(
  referenceNumber: string,
  config: FrontendRuntimeConfig
): Promise<PrototypeSubmissionSummaryMetadata> {
  const data = await executeBackendData<{
    submissionSummary: BackendSubmissionSummary | null;
  }, { referenceNumber: string }>({
    config,
    query: SUBMISSION_SUMMARY_QUERY,
    variables: {
      referenceNumber
    }
  });

  return {
    filename: data.submissionSummary?.fileName ?? `${referenceNumber.toLowerCase()}-summary.txt`,
    href: `/service-requests/${referenceNumber}/summary/download`,
    referenceNumber
  };
}

async function executeBackendData<TData, TVariables extends Record<string, unknown> = Record<string, never>>(input: {
  config: FrontendRuntimeConfig;
  query: string;
  variables?: TVariables;
}): Promise<TData> {
  const response = await executeBackendGraphql<TData, TVariables>(
    {
      query: input.query,
      variables: input.variables
    },
    {
      config: toBackendClientConfig(input.config)
    }
  );

  return unwrapBackendResponse(response);
}

function unwrapBackendResponse<TData>(response: BackendGraphqlResponse<TData>): TData {
  if (response.errors && response.errors.length > 0) {
    throw new BackendClientError(response.errors[0]?.message ?? "Backend GraphQL request failed.", response.correlationId);
  }

  if (!response.data) {
    throw new BackendClientError("Backend GraphQL response did not include data.", response.correlationId);
  }

  return response.data;
}

function requireMappedValue<TValue>(value: TValue | undefined, message: string): TValue {
  if (!value) {
    throw new BackendClientError(message, createCorrelationId());
  }

  return value;
}

function toBackendClientConfig(config: FrontendRuntimeConfig): BackendClientConfig {
  if (!config.backendUrl) {
    throw new BackendClientError("Backend service URL is not configured.", createCorrelationId());
  }

  return {
    backendUrl: config.backendUrl
  };
}

function createValidPayload(appKey: TransactionAppKey): Record<string, unknown> {
  if (appKey === "rental-security-subsidy") {
    return {
      householdIncome: 1240,
      rentalBondAmount: 2480,
      supportingDocuments: ["rental-property-evidence.pdf"]
    };
  }

  return {
    concessionConsent: true,
    dateOfBirth: "1960-01-01",
    residencyStatus: "queensland-resident"
  };
}

function createInvalidPayload(appKey: TransactionAppKey): Record<string, unknown> {
  if (appKey === "rental-security-subsidy") {
    return {
      householdIncome: 1240
    };
  }

  return {
    dateOfBirth: "not-a-date",
    residencyStatus: "queensland-resident"
  };
}

function mapValidationErrors(
  appKey: TransactionAppKey,
  fieldErrors: BackendFieldValidationError[]
): PrototypeValidationError[] {
  return fieldErrors.map((error) => ({
    fieldPath: mapValidationField(appKey, error.field),
    message: error.message
  }));
}

function mapValidationErrorsFromBackendFields(fieldErrors: BackendFieldValidationError[]): PrototypeValidationError[] {
  return fieldErrors.map((error) => ({
    fieldPath: error.field,
    message: error.message
  }));
}

function createUploadCategories(categories: string[]): PrototypeUploadCategory[] {
  return categories.map((category) => ({
    hint: backendUploadCategoryHints[category],
    label: formatDocumentCategory(category),
    value: category
  }));
}

function mapValidationField(appKey: TransactionAppKey, field: string): string {
  if (appKey === "rental-security-subsidy") {
    const fieldMap: Record<string, string> = {
      householdIncome: "household.income",
      rentalBondAmount: "rentalProperty.weeklyRent"
    };

    return fieldMap[field] ?? field;
  }

  const fieldMap: Record<string, string> = {
    dateOfBirth: "eligibility.dateOfBirth",
    residencyStatus: "eligibility.residencyStatus"
  };

  return fieldMap[field] ?? field;
}

function mapServiceRequestStatus(status: string): Exclude<ServiceRequestStatus, "DRAFT"> {
  switch (status) {
    case "UNDER_REVIEW":
      return "IN_REVIEW";
    case "COMPLETED":
      return "APPROVED";
    case "ACTION_REQUIRED":
      return "ACTION_REQUIRED";
    case "SUBMITTED":
      return "SUBMITTED";
    default:
      return "SUBMITTED";
  }
}

function isTransactionAppKey(value: unknown): value is TransactionAppKey {
  return value === "seniors-card" || value === "rental-security-subsidy";
}

function createPendingDraftSummary(appKey: TransactionAppKey): PrototypeDraftSummary {
  return {
    appKey,
    draftId: `${appKey}-backend-draft-pending`,
    lastUpdated: new Date().toISOString(),
    status: "DRAFT",
    title: createPrototypeAppSummary(appKey).label
  };
}

function createPendingSubmittedRequestSummary(appKey: TransactionAppKey): PrototypeSubmittedRequestSummary {
  return {
    appKey,
    referenceNumber: "No submitted request yet",
    status: "SUBMITTED",
    submittedAt: new Date().toISOString(),
    title: createPrototypeAppSummary(appKey).label
  };
}

function formatDocumentCategory(category: string): string {
  return category
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function extractFilename(contentDisposition: string | null): string | undefined {
  return contentDisposition?.match(/filename="(?<filename>[^"]+)"/)?.groups?.filename;
}
