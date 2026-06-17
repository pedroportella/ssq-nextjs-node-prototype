import "server-only";

import { createPrototypeAppSummary } from "../index";
import {
  createMockActivity,
  createMockDashboardSummaryData,
  createMockDraftSummary,
  createMockReviewerAssignResult,
  createMockReviewerBatchStatusResult,
  createMockReviewerQueueData,
  createMockReviewerRequestDetailData,
  createMockSubmissionSummaryMetadata,
  createMockSubmissionSummaryDownload,
  createMockSupportingDocumentDownload,
  createMockSupportingDocumentUploadResult,
  createMockValidationErrors,
  createMockWorkflowData,
  mockUploadPolicy,
  createMockUploadedDocuments
} from "./mockData";
import { resolveFrontendPublicUrlConfig } from "./publicUrls";

import type {
  PrototypeAppKey,
  PrototypeDashboardSummaryData,
  PrototypeDraftMutationResult,
  PrototypeReviewerAssignInput,
  PrototypeReviewerAssignResult,
  PrototypeReviewerBatchStatusInput,
  PrototypeReviewerBatchStatusResult,
  PrototypeReviewerQueueData,
  PrototypeReviewerQueueFilters,
  PrototypeReviewerRequestDetailData,
  PrototypeSupportingDocumentDownload,
  PrototypeSupportingDocumentUploadInput,
  PrototypeSupportingDocumentUploadResult,
  PrototypeSubmissionSummaryDownload,
  PrototypeSubmitResult,
  PrototypeUploadedDocument,
  PrototypeUploadPolicy,
  PrototypeWorkflowData
} from "../index";
import type { AppShellData } from "./appServices";

export function createMockAppShellData(key: PrototypeAppKey): AppShellData {
  return {
    app: createPrototypeAppSummary(key),
    backendBoundary: "server-only",
    dataSource: "mock"
  };
}

export async function getMockDashboardSummaryData(): Promise<PrototypeDashboardSummaryData> {
  return createMockDashboardSummaryData(resolveFrontendPublicUrlConfig());
}

export async function getMockSeniorsCardWorkflowData(): Promise<PrototypeWorkflowData> {
  return createMockWorkflowData("seniors-card");
}

export async function getMockRentalSecuritySubsidyWorkflowData(): Promise<PrototypeWorkflowData> {
  return createMockWorkflowData("rental-security-subsidy");
}

export async function createMockDraft(appKey: Exclude<PrototypeAppKey, "dashboard">): Promise<PrototypeDraftMutationResult> {
  return {
    draft: createMockDraftSummary(appKey),
    validationErrors: []
  };
}

export async function updateMockDraftWithValidationError(
  appKey: Exclude<PrototypeAppKey, "dashboard">
): Promise<PrototypeDraftMutationResult> {
  return {
    draft: createMockDraftSummary(appKey),
    validationErrors: createMockValidationErrors(appKey)
  };
}

export async function submitMockDraft(appKey: Exclude<PrototypeAppKey, "dashboard">): Promise<PrototypeSubmitResult> {
  const summary = createMockSubmissionSummaryMetadata(appKey);

  return {
    activity: createMockActivity(appKey),
    referenceNumber: summary.referenceNumber,
    status: appKey === "seniors-card" ? "APPROVED" : "IN_REVIEW",
    summary
  };
}

export async function getMockSupportingDocumentUploadPolicy(): Promise<PrototypeUploadPolicy> {
  return mockUploadPolicy;
}

export async function getMockUploadedDocuments(appKey: Exclude<PrototypeAppKey, "dashboard">): Promise<PrototypeUploadedDocument[]> {
  return createMockUploadedDocuments(appKey);
}

export async function getMockReviewerQueueData(
  filters: PrototypeReviewerQueueFilters = {}
): Promise<PrototypeReviewerQueueData> {
  return createMockReviewerQueueData(filters);
}

export async function getMockReviewerRequestDetailData(referenceNumber: string): Promise<PrototypeReviewerRequestDetailData> {
  return createMockReviewerRequestDetailData(referenceNumber);
}

export async function batchUpdateMockReviewerRequestStatus(
  input: PrototypeReviewerBatchStatusInput
): Promise<PrototypeReviewerBatchStatusResult> {
  return createMockReviewerBatchStatusResult(input);
}

export async function assignMockReviewerRequest(input: PrototypeReviewerAssignInput): Promise<PrototypeReviewerAssignResult> {
  return createMockReviewerAssignResult(input);
}

export async function recordMockSupportingDocumentUploadMetadata(
  input: PrototypeSupportingDocumentUploadInput
): Promise<PrototypeSupportingDocumentUploadResult> {
  return createMockSupportingDocumentUploadResult(input);
}

export async function getMockSubmissionSummaryDownload(
  appKey: Exclude<PrototypeAppKey, "dashboard">,
  referenceNumber: string
): Promise<PrototypeSubmissionSummaryDownload> {
  return createMockSubmissionSummaryDownload(appKey, referenceNumber);
}

export async function getMockSupportingDocumentDownload(
  appKey: Exclude<PrototypeAppKey, "dashboard">,
  referenceNumber: string,
  documentId: string
): Promise<PrototypeSupportingDocumentDownload> {
  return createMockSupportingDocumentDownload(appKey, referenceNumber, documentId);
}
