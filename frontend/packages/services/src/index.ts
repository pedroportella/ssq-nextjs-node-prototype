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
  fileName: string;
  message?: string;
  mimeType?: string;
  personKey?: string;
  sizeBytes: number;
  status: "uploaded" | "rejected";
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
