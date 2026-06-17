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
  PrototypeReviewerActivityEntry,
  PrototypeReviewerAssignInput,
  PrototypeReviewerAssignResult,
  PrototypeReviewerBatchStatusInput,
  PrototypeReviewerBatchStatusItem,
  PrototypeReviewerBatchStatusResult,
  PrototypeReviewerPayloadItem,
  PrototypeReviewerQueueData,
  PrototypeReviewerQueueFilters,
  PrototypeReviewerRequestDetailData,
  PrototypeReviewerRequestSummary,
  PrototypeReviewerStatus,
  PrototypeReviewerStatusCount,
  PrototypeServiceCatalogueEntry,
  PrototypeSessionRole,
  PrototypeSessionSummary,
  PrototypeSupportingDocumentDownload,
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
  assignedOfficerSubject?: string | null;
  assignedTeam?: string | null;
  id: string;
  lastTouchedAt?: string | null;
  lastTouchedBy?: string | null;
  payload: Record<string, unknown>;
  referenceNumber: string;
  status: BackendServiceRequestStatus | string;
  transactionKey?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface BackendPlatformInfo {
  demoRole: string;
  demoSubject: string;
  identityAssuranceLevel?: string;
  identityDisplayName: string;
  identitySource?: string;
}

interface BackendSupportingDocument {
  category: string;
  fileName: string;
  id?: string;
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

interface BackendPageInfo {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

interface BackendServiceRequestStatusCount {
  count: number;
  status: BackendServiceRequestStatus | string;
}

interface BackendServiceRequestConnection {
  items: BackendServiceRequest[];
  pageInfo: BackendPageInfo;
  statusCounts: BackendServiceRequestStatusCount[];
}

interface BackendServiceRequestConnectionResult {
  connection: BackendServiceRequestConnection | null;
  error: BackendMutationError | null;
  ok: boolean;
}

interface BackendActivityLog {
  createdAt: string;
  eventPayload: Record<string, unknown>;
  eventType: string;
}

interface BackendStatusMutationResponse {
  error: BackendMutationError | null;
  ok: boolean;
  serviceRequest: BackendServiceRequest | null;
}

interface BackendBatchStatusMutationResponse {
  error: BackendMutationError | null;
  ok: boolean;
  results: Array<{
    error: BackendMutationError | null;
    ok: boolean;
    referenceNumber: string;
    serviceRequest: BackendServiceRequest | null;
  }>;
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
      id
      category
      fileName
      mimeType
      sizeBytes
      uploadStatus
      scanStatus
    }
  }
`;

const PLATFORM_QUERY = /* GraphQL */ `
  query FrontendPlatform {
    platform {
      demoRole
      demoSubject
      identityAssuranceLevel
      identityDisplayName
      identitySource
    }
  }
`;

const REVIEWER_QUEUE_QUERY = /* GraphQL */ `
  query FrontendReviewerQueue($input: ServiceRequestListInput) {
    platform {
      demoRole
      demoSubject
      identityDisplayName
    }
    submittedServiceRequestConnection(input: $input) {
      ok
      error {
        code
        message
      }
      connection {
        items {
          id
          payload
          referenceNumber
          status
          transactionKey
          assignedOfficerSubject
          assignedTeam
          lastTouchedBy
          lastTouchedAt
          createdAt
          updatedAt
        }
        pageInfo {
          page
          pageSize
          totalItems
          totalPages
        }
        statusCounts {
          status
          count
        }
      }
    }
  }
`;

const REVIEWER_REQUEST_QUERY = /* GraphQL */ `
  query FrontendReviewerRequest($referenceNumber: String!) {
    platform {
      demoRole
      demoSubject
      identityDisplayName
    }
    serviceRequest(referenceNumber: $referenceNumber) {
      id
      payload
      referenceNumber
      status
      transactionKey
      assignedOfficerSubject
      assignedTeam
      lastTouchedBy
      lastTouchedAt
      createdAt
      updatedAt
    }
    supportingDocuments(referenceNumber: $referenceNumber) {
      id
      category
      fileName
      mimeType
      sizeBytes
      uploadStatus
      scanStatus
    }
  }
`;

const REVIEWER_ACTIVITY_QUERY = /* GraphQL */ `
  query FrontendReviewerActivity($serviceRequestId: ID!) {
    activityLogs(serviceRequestId: $serviceRequestId) {
      eventType
      eventPayload
      createdAt
    }
  }
`;

const REVIEWER_BATCH_STATUS_MUTATION = /* GraphQL */ `
  mutation FrontendReviewerBatchStatus($input: BatchUpdateServiceRequestStatusInput!) {
    batchUpdateServiceRequestStatus(input: $input) {
      ok
      error {
        code
        message
      }
      results {
        ok
        referenceNumber
        error {
          code
          message
        }
        serviceRequest {
          id
          payload
          referenceNumber
          status
          transactionKey
          assignedOfficerSubject
          assignedTeam
          lastTouchedBy
          lastTouchedAt
          createdAt
          updatedAt
        }
      }
    }
  }
`;

const REVIEWER_ASSIGN_MUTATION = /* GraphQL */ `
  mutation FrontendReviewerAssign($input: AssignServiceRequestInput!) {
    assignServiceRequest(input: $input) {
      ok
      error {
        code
        message
      }
      serviceRequest {
        id
        payload
        referenceNumber
        status
        transactionKey
        assignedOfficerSubject
        assignedTeam
        lastTouchedBy
        lastTouchedAt
        createdAt
        updatedAt
      }
    }
  }
`;

export async function createBackendAppShellData(
  key: PrototypeAppKey,
  config: FrontendRuntimeConfig
): Promise<AppShellData> {
  const data = await executeBackendSessionData<{
    platform: BackendPlatformInfo;
  }>({
    config,
    query: PLATFORM_QUERY
  });

  return {
    app: createPrototypeAppSummary(key),
    backendBoundary: "server-only",
    dataSource: "backend",
    session: mapPlatformSession(data.platform)
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

  const summary = createDashboardSummary(data);
  const submittedRequests = await Promise.all(
    summary.submittedRequests.map(async (request) => ({
      ...request,
      supportingDocuments: await getBackendSupportingDocumentsForReference(request.referenceNumber, config)
    }))
  );

  return {
    ...summary,
    submittedRequests
  };
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
  const supportingDocuments = submittedRequest.supportingDocuments ?? [];

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
    document: payload.document
      ? mapUploadedDocument(
          payload.document,
          input.target.type === "SERVICE_REQUEST" ? input.target.referenceNumber : undefined
        )
      : undefined,
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

  return submittedRequest.supportingDocuments ?? [];
}

export async function getBackendReviewerQueueData(
  filters: PrototypeReviewerQueueFilters,
  config: FrontendRuntimeConfig
): Promise<PrototypeReviewerQueueData> {
  const data = await executeBackendReviewerData<{
    platform: BackendPlatformInfo;
    submittedServiceRequestConnection: BackendServiceRequestConnectionResult;
  }, { input: Record<string, unknown> }>({
    config,
    query: REVIEWER_QUEUE_QUERY,
    variables: {
      input: toBackendReviewerQueueInput(filters)
    }
  });
  const result = data.submittedServiceRequestConnection;

  if (!result.ok || !result.connection) {
    return emptyReviewerQueueData({
      filters,
      platform: data.platform
    });
  }

  return {
    canReview: isReviewerRole(data.platform.demoRole),
    filters,
    pageInfo: result.connection.pageInfo,
    requests: result.connection.items
      .map(mapReviewerRequestSummary)
      .filter((request): request is PrototypeReviewerRequestSummary => Boolean(request)),
    reviewerRole: data.platform.demoRole,
    reviewerSubject: data.platform.demoSubject,
    statusCounts: mapReviewerStatusCounts(result.connection.statusCounts)
  };
}

export async function getBackendReviewerRequestDetailData(
  referenceNumber: string,
  config: FrontendRuntimeConfig
): Promise<PrototypeReviewerRequestDetailData> {
  const data = await executeBackendReviewerData<{
    platform: BackendPlatformInfo;
    serviceRequest: BackendServiceRequest | null;
    supportingDocuments: BackendSupportingDocument[];
  }, { referenceNumber: string }>({
    config,
    query: REVIEWER_REQUEST_QUERY,
    variables: {
      referenceNumber
    }
  });
  const request = data.serviceRequest ? mapReviewerRequestSummary(data.serviceRequest) : undefined;
  const activity = request
    ? await getBackendReviewerActivity(data.serviceRequest as BackendServiceRequest, config)
    : [];

  return {
    activity,
    canReview: isReviewerRole(data.platform.demoRole),
    payloadItems: data.serviceRequest ? mapPayloadItems(data.serviceRequest.payload) : [],
    request,
    reviewerRole: data.platform.demoRole,
    reviewerSubject: data.platform.demoSubject,
    supportingDocuments: data.supportingDocuments.map((document) => mapUploadedDocument(document, referenceNumber))
  };
}

export async function batchUpdateBackendReviewerRequestStatus(
  input: PrototypeReviewerBatchStatusInput,
  config: FrontendRuntimeConfig
): Promise<PrototypeReviewerBatchStatusResult> {
  const data = await executeBackendReviewerData<{
    batchUpdateServiceRequestStatus: BackendBatchStatusMutationResponse;
  }, { input: { reason?: string; referenceNumbers: string[]; status: string } }>({
    config,
    query: REVIEWER_BATCH_STATUS_MUTATION,
    variables: {
      input: {
        reason: input.reason,
        referenceNumbers: input.referenceNumbers,
        status: toBackendServiceRequestStatus(input.status)
      }
    }
  });
  const result = data.batchUpdateServiceRequestStatus;

  return {
    error: result.error ?? undefined,
    ok: result.ok,
    results: result.results.map(mapReviewerBatchStatusItem)
  };
}

export async function assignBackendReviewerRequest(
  input: PrototypeReviewerAssignInput,
  config: FrontendRuntimeConfig
): Promise<PrototypeReviewerAssignResult> {
  const data = await executeBackendReviewerData<{
    assignServiceRequest: BackendStatusMutationResponse;
  }, { input: PrototypeReviewerAssignInput }>({
    config,
    query: REVIEWER_ASSIGN_MUTATION,
    variables: {
      input
    }
  });
  const result = data.assignServiceRequest;

  return {
    error: result.error ?? undefined,
    ok: result.ok,
    request: result.serviceRequest ? mapReviewerRequestSummary(result.serviceRequest) : undefined
  };
}

async function getBackendSupportingDocumentsForReference(
  referenceNumber: string,
  config: FrontendRuntimeConfig
): Promise<PrototypeUploadedDocument[]> {
  const data = await executeBackendData<{
    supportingDocuments: BackendSupportingDocument[];
  }, { referenceNumber: string }>({
    config,
    query: SUPPORTING_DOCUMENTS_QUERY,
    variables: {
      referenceNumber
    }
  });

  return data.supportingDocuments.map((document) => mapUploadedDocument(document, referenceNumber));
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

export async function getBackendSupportingDocumentDownload(
  _appKey: TransactionAppKey,
  referenceNumber: string,
  documentId: string,
  config: FrontendRuntimeConfig
): Promise<PrototypeSupportingDocumentDownload> {
  const backendConfig = toBackendClientConfig(config);
  const correlationId = createCorrelationId();
  const encodedReferenceNumber = encodeURIComponent(referenceNumber);
  const encodedDocumentId = encodeURIComponent(documentId);
  const response = await fetch(
    `${backendConfig.backendUrl}/service-requests/${encodedReferenceNumber}/supporting-documents/${encodedDocumentId}/download`,
    {
      cache: "no-store",
      headers: createBackendHeaders(correlationId)
    }
  );

  if (!response.ok) {
    throw new BackendClientError("Backend supporting document download failed.", correlationId, response.status);
  }

  return {
    body: await response.text(),
    contentType: "text/plain",
    documentId,
    filename: extractFilename(response.headers.get("content-disposition")) ?? `${documentId}.prototype.txt`,
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

function mapPlatformSession(platform: BackendPlatformInfo): PrototypeSessionSummary {
  const role = isPrototypeSessionRole(platform.demoRole) ? platform.demoRole : "Citizen";

  return {
    capabilities: {
      canAccessCitizenServices: role === "Citizen",
      canReadOperations: role === "Admin",
      canReviewSubmittedRequests: isReviewerRole(role)
    },
    displayName: platform.identityDisplayName,
    identityStrength: platform.identityAssuranceLevel === "DEMO_LOW_ASSURANCE" ? "basic" : "verified",
    roles: [role],
    signedIn: true,
    source: "DEMO_HEADER",
    subject: platform.demoSubject
  };
}

function isPrototypeSessionRole(value: string): value is PrototypeSessionRole {
  return value === "Citizen" || value === "ServiceOfficer" || value === "TeamLead" || value === "Admin";
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

function mapReviewerRequestSummary(request: BackendServiceRequest): PrototypeReviewerRequestSummary | undefined {
  if (!isTransactionAppKey(request.transactionKey)) {
    return undefined;
  }

  return {
    appKey: request.transactionKey,
    assignedOfficerSubject: request.assignedOfficerSubject ?? undefined,
    assignedTeam: request.assignedTeam ?? undefined,
    id: request.id,
    lastTouchedAt: request.lastTouchedAt ?? undefined,
    lastTouchedBy: request.lastTouchedBy ?? undefined,
    referenceNumber: request.referenceNumber,
    status: mapReviewerStatus(request.status),
    submittedAt: request.createdAt,
    title: createPrototypeAppSummary(request.transactionKey).label
  };
}

function mapReviewerStatus(status: string): PrototypeReviewerStatus {
  return mapServiceRequestStatus(status);
}

function toBackendServiceRequestStatus(status: PrototypeReviewerStatus): BackendServiceRequestStatus {
  switch (status) {
    case "IN_REVIEW":
      return "UNDER_REVIEW";
    case "APPROVED":
      return "COMPLETED";
    case "ACTION_REQUIRED":
      return "ACTION_REQUIRED";
    case "SUBMITTED":
      return "SUBMITTED";
  }
}

function toBackendReviewerQueueInput(filters: PrototypeReviewerQueueFilters): Record<string, unknown> {
  return {
    page: filters.page ?? 1,
    pageSize: 20,
    search: filters.search,
    sortBy: filters.sortBy ?? "createdAt",
    sortDirection: filters.sortDirection ?? "DESC",
    status: filters.status ? toBackendServiceRequestStatus(filters.status) : undefined
  };
}

function emptyReviewerQueueData(input: {
  filters: PrototypeReviewerQueueFilters;
  platform: BackendPlatformInfo;
}): PrototypeReviewerQueueData {
  return {
    canReview: isReviewerRole(input.platform.demoRole),
    filters: input.filters,
    pageInfo: {
      page: input.filters.page ?? 1,
      pageSize: 20,
      totalItems: 0,
      totalPages: 0
    },
    requests: [],
    reviewerRole: input.platform.demoRole,
    reviewerSubject: input.platform.demoSubject,
    statusCounts: []
  };
}

function mapReviewerStatusCounts(counts: BackendServiceRequestStatusCount[]): PrototypeReviewerStatusCount[] {
  const mappedCounts = new Map<PrototypeReviewerStatus, number>();

  for (const count of counts) {
    const status = mapReviewerStatus(count.status);
    mappedCounts.set(status, (mappedCounts.get(status) ?? 0) + count.count);
  }

  return Array.from(mappedCounts.entries()).map(([status, count]) => ({ count, status }));
}

function mapReviewerBatchStatusItem(item: BackendBatchStatusMutationResponse["results"][number]): PrototypeReviewerBatchStatusItem {
  return {
    error: item.error ?? undefined,
    ok: item.ok,
    referenceNumber: item.referenceNumber,
    request: item.serviceRequest ? mapReviewerRequestSummary(item.serviceRequest) : undefined
  };
}

function mapPayloadItems(payload: Record<string, unknown>): PrototypeReviewerPayloadItem[] {
  return Object.entries(payload).map(([key, value]) => ({
    label: formatPayloadLabel(key),
    value: formatPayloadValue(value)
  }));
}

function formatPayloadLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (character) => character.toUpperCase());
}

function formatPayloadValue(value: unknown): string {
  if (Array.isArray(value)) {
    return value.map(formatPayloadValue).join(", ");
  }

  if (value && typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}

async function getBackendReviewerActivity(
  request: BackendServiceRequest,
  config: FrontendRuntimeConfig
): Promise<PrototypeReviewerActivityEntry[]> {
  const data = await executeBackendReviewerData<{
    activityLogs: BackendActivityLog[];
  }, { serviceRequestId: string }>({
    config,
    query: REVIEWER_ACTIVITY_QUERY,
    variables: {
      serviceRequestId: request.id
    }
  });

  return data.activityLogs.map((entry) => ({
    at: entry.createdAt,
    description: formatActivityDescription(entry)
  }));
}

function formatActivityDescription(entry: BackendActivityLog): string {
  const referenceNumber = typeof entry.eventPayload.referenceNumber === "string" ? entry.eventPayload.referenceNumber : undefined;

  switch (entry.eventType) {
    case "SERVICE_REQUEST_ASSIGNMENT_CHANGED":
      return `Assignment changed${referenceNumber ? ` for ${referenceNumber}` : ""}`;
    case "SERVICE_REQUEST_STATUS_CHANGED":
      return `Status changed${referenceNumber ? ` for ${referenceNumber}` : ""}`;
    case "SUPPORTING_DOCUMENT_DOWNLOADED":
      return "Supporting document downloaded";
    case "SERVICE_REQUEST_DETAIL_VIEWED":
      return "Request detail viewed";
    default:
      return entry.eventType
        .toLowerCase()
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
  }
}

function isReviewerRole(role: string): boolean {
  return role === "ServiceOfficer" || role === "TeamLead" || role === "Admin";
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

function mapUploadedDocument(document: BackendSupportingDocument, referenceNumber?: string): PrototypeUploadedDocument {
  const rejectedScanStatuses = new Set(["QUARANTINED", "REJECTED"]);
  const status = document.uploadStatus === "REJECTED" || rejectedScanStatuses.has(document.scanStatus) ? "rejected" : "uploaded";
  const downloadHref = status === "uploaded" && document.id && isBackendDocumentAvailable(document)
    ? createSupportingDocumentDownloadHref(referenceNumber, document.id)
    : undefined;

  return {
    category: formatDocumentCategory(document.category),
    downloadHref,
    fileName: document.fileName,
    id: document.id,
    message: document.uploadStatus === "REJECTED" ? backendUploadPolicy.rejectedExample.message : undefined,
    mimeType: document.mimeType,
    personKey: typeof document.metadata?.personKey === "string" ? document.metadata.personKey : undefined,
    sizeBytes: document.sizeBytes,
    status
  };
}

function createSupportingDocumentDownloadHref(referenceNumber: string | undefined, documentId: string): string | undefined {
  if (!referenceNumber) {
    return undefined;
  }

  return `/service-requests/${encodeURIComponent(referenceNumber)}/supporting-documents/${encodeURIComponent(documentId)}/download`;
}

function isBackendDocumentAvailable(document: BackendSupportingDocument): boolean {
  return document.uploadStatus !== "REJECTED" && ["AVAILABLE", "PASSED"].includes(document.scanStatus);
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

async function executeBackendReviewerData<TData, TVariables extends Record<string, unknown> = Record<string, never>>(input: {
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
      config: toBackendClientConfig(input.config),
      headers: createReviewerHeaders()
    }
  );

  return unwrapBackendResponse(response);
}

async function executeBackendSessionData<TData, TVariables extends Record<string, unknown> = Record<string, never>>(input: {
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
      config: toBackendClientConfig(input.config),
      headers: createFrontendSessionHeaders()
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

function createReviewerHeaders(): HeadersInit {
  return {
    "x-ssq-demo-role": process.env.SSQ_REVIEWER_DEMO_ROLE ?? "ServiceOfficer",
    "x-ssq-demo-subject": process.env.SSQ_REVIEWER_DEMO_SUBJECT ?? "officer@example.test"
  };
}

function createFrontendSessionHeaders(): HeadersInit {
  return {
    ...(process.env.SSQ_FRONTEND_DEMO_ROLE ? { "x-ssq-demo-role": process.env.SSQ_FRONTEND_DEMO_ROLE } : {}),
    ...(process.env.SSQ_FRONTEND_DEMO_SUBJECT ? { "x-ssq-demo-subject": process.env.SSQ_FRONTEND_DEMO_SUBJECT } : {})
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
