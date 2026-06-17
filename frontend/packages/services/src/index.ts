import { formatPrototypeLabel } from "@ssq/utils";

export type PrototypeAppKey = "dashboard" | "seniors-card" | "rental-security-subsidy";

export interface PrototypeAppSummary {
  key: PrototypeAppKey;
  label: string;
  status: "UP";
}

export type ServiceRequestStatus = "DRAFT" | "SUBMITTED" | "IN_REVIEW" | "APPROVED" | "ACTION_REQUIRED";

export interface PrototypeProfileSummary {
  displayName: string;
  email: string;
  identityStrength: "basic" | "verified";
}

export type PrototypeSessionRole = "Citizen" | "ServiceOfficer" | "TeamLead" | "Admin";

export interface PrototypeSessionCapabilities {
  canAccessCitizenServices: boolean;
  canReadOperations: boolean;
  canReviewSubmittedRequests: boolean;
}

export interface PrototypeSessionSummary {
  capabilities: PrototypeSessionCapabilities;
  displayName: string;
  identityStrength: "basic" | "verified";
  roles: PrototypeSessionRole[];
  signedIn: boolean;
  source: "DEMO_HEADER" | "MOCK";
  subject: string;
}

export interface PrototypeServiceCatalogueEntry {
  appKey: PrototypeAppKey;
  description: string;
  href: string;
  label: string;
  status: "available" | "coming-soon";
}

export interface PrototypeDraftSummary {
  appKey: PrototypeAppKey;
  draftId: string;
  lastUpdated: string;
  status: "DRAFT";
  title: string;
}

export interface PrototypeSubmittedRequestSummary {
  appKey: PrototypeAppKey;
  referenceNumber: string;
  status: Exclude<ServiceRequestStatus, "DRAFT">;
  submittedAt: string;
  supportingDocuments?: PrototypeUploadedDocument[];
  title: string;
}

export interface PrototypeActivityEntry {
  at: string;
  description: string;
  status: ServiceRequestStatus;
}

export interface PrototypeValidationError {
  fieldPath: string;
  message: string;
}

export interface PrototypeUploadCategory {
  hint?: string;
  label: string;
  value: string;
}

export interface PrototypeUploadPolicy {
  acceptedFileTypes: string[];
  allowedCategories: PrototypeUploadCategory[];
  defaultPersonKey: string;
  maxFileSizeBytes: number;
  maxFilesPerPerson: number;
  maxTotalSizeBytesPerPerson: number;
  rejectedExample: PrototypeValidationError;
}

export interface PrototypeUploadedDocument {
  category: string;
  downloadHref?: string;
  fileName: string;
  id?: string;
  message?: string;
  mimeType?: string;
  personKey?: string;
  sizeBytes: number;
  status: "uploaded" | "rejected";
}

export type PrototypeReviewerStatus = Exclude<ServiceRequestStatus, "DRAFT">;

export interface PrototypeReviewerQueueFilters {
  page?: number;
  search?: string;
  sortBy?: "assignedOfficer" | "assignedTeam" | "createdAt" | "lastTouchedAt" | "referenceNumber" | "status" | "transactionKey";
  sortDirection?: "ASC" | "DESC";
  status?: PrototypeReviewerStatus;
}

export interface PrototypeReviewerQueuePageInfo {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface PrototypeReviewerStatusCount {
  count: number;
  status: PrototypeReviewerStatus;
}

export interface PrototypeReviewerRequestSummary {
  appKey: Exclude<PrototypeAppKey, "dashboard">;
  assignedOfficerSubject?: string;
  assignedTeam?: string;
  id: string;
  lastTouchedAt?: string;
  lastTouchedBy?: string;
  referenceNumber: string;
  status: PrototypeReviewerStatus;
  submittedAt: string;
  title: string;
}

export interface PrototypeReviewerQueueData {
  canReview: boolean;
  filters: PrototypeReviewerQueueFilters;
  pageInfo: PrototypeReviewerQueuePageInfo;
  reviewerRole: string;
  reviewerSubject: string;
  statusCounts: PrototypeReviewerStatusCount[];
  requests: PrototypeReviewerRequestSummary[];
}

export interface PrototypeReviewerPayloadItem {
  label: string;
  value: string;
}

export interface PrototypeReviewerActivityEntry {
  at: string;
  description: string;
}

export interface PrototypeReviewerRequestDetailData {
  activity: PrototypeReviewerActivityEntry[];
  canReview: boolean;
  payloadItems: PrototypeReviewerPayloadItem[];
  request?: PrototypeReviewerRequestSummary;
  reviewerRole: string;
  reviewerSubject: string;
  supportingDocuments: PrototypeUploadedDocument[];
}

export interface PrototypeReviewerBatchStatusInput {
  reason?: string;
  referenceNumbers: string[];
  status: PrototypeReviewerStatus;
}

export interface PrototypeReviewerBatchStatusItem {
  error?: {
    code: string;
    message: string;
  };
  ok: boolean;
  referenceNumber: string;
  request?: PrototypeReviewerRequestSummary;
}

export interface PrototypeReviewerBatchStatusResult {
  error?: {
    code: string;
    message: string;
  };
  ok: boolean;
  results: PrototypeReviewerBatchStatusItem[];
}

export interface PrototypeReviewerAssignInput {
  assignedOfficerSubject?: string;
  assignedTeam?: string;
  reason?: string;
  referenceNumber: string;
}

export interface PrototypeReviewerAssignResult {
  error?: {
    code: string;
    message: string;
  };
  ok: boolean;
  request?: PrototypeReviewerRequestSummary;
}

export type PrototypeSupportingDocumentTarget =
  | {
      draftId: string;
      type: "DRAFT";
    }
  | {
      referenceNumber: string;
      type: "SERVICE_REQUEST";
    };

export interface PrototypeSupportingDocumentUploadInput {
  category: string;
  fileName: string;
  mimeType: string;
  personKey: string;
  sizeBytes: number;
  target: PrototypeSupportingDocumentTarget;
}

export interface PrototypeSupportingDocumentUploadResult {
  document?: PrototypeUploadedDocument;
  error?: {
    code: string;
    message: string;
  };
  fieldErrors: PrototypeValidationError[];
  ok: boolean;
  policy: PrototypeUploadPolicy;
}

export interface PrototypeSubmissionSummaryMetadata {
  filename: string;
  href: string;
  referenceNumber: string;
}

export interface PrototypeSubmissionSummaryDownload {
  body: string;
  contentType: "text/plain";
  filename: string;
  referenceNumber: string;
}

export interface PrototypeSupportingDocumentDownload {
  body: string;
  contentType: "text/plain";
  documentId: string;
  filename: string;
  referenceNumber: string;
}

export interface PrototypeDashboardSummaryData {
  activity: PrototypeActivityEntry[];
  availableServices: PrototypeServiceCatalogueEntry[];
  drafts: PrototypeDraftSummary[];
  profile: PrototypeProfileSummary;
  submittedRequests: PrototypeSubmittedRequestSummary[];
}

export interface PrototypeWorkflowData {
  activity: PrototypeActivityEntry[];
  app: PrototypeAppSummary;
  draft: PrototypeDraftSummary;
  profile: PrototypeProfileSummary;
  submittedRequest: PrototypeSubmittedRequestSummary;
  supportingDocuments: PrototypeUploadedDocument[];
  uploadPolicy: PrototypeUploadPolicy;
  validationErrors: PrototypeValidationError[];
}

export interface PrototypeDraftMutationResult {
  draft: PrototypeDraftSummary;
  validationErrors: PrototypeValidationError[];
}

export interface PrototypeSubmitResult {
  activity: PrototypeActivityEntry[];
  referenceNumber: string;
  status: Exclude<ServiceRequestStatus, "DRAFT">;
  summary: PrototypeSubmissionSummaryMetadata;
}

export function createPrototypeAppSummary(key: PrototypeAppKey): PrototypeAppSummary {
  return {
    key,
    label: key === "dashboard" ? "SSQ Service Dashboard" : formatPrototypeLabel(key),
    status: "UP"
  };
}
