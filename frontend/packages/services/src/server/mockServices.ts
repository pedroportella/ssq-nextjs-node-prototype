import "server-only";

import { createPrototypeAppSummary } from "../index";
import {
  createMockActivity,
  createMockDashboardSummaryData,
  createMockDraftSummary,
  createMockSubmissionSummaryMetadata,
  createMockWorkflowData,
  mockValidationErrors
} from "./mockData";

import type {
  PrototypeAppKey,
  PrototypeDashboardSummaryData,
  PrototypeDraftMutationResult,
  PrototypeSubmitResult,
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
  return createMockDashboardSummaryData();
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
    validationErrors: mockValidationErrors
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
