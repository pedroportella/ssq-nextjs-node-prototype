import "server-only";

import { createBackendAppShellData } from "./backendServices";
import {
  createMockAppShellData,
  createMockDraft,
  getMockDashboardSummaryData,
  getMockSubmissionSummaryDownload,
  getMockSupportingDocumentUploadPolicy,
  getMockUploadedDocuments,
  getMockRentalSecuritySubsidyWorkflowData,
  getMockSeniorsCardWorkflowData,
  submitMockDraft,
  updateMockDraftWithValidationError
} from "./mockServices";
import { resolveFrontendRuntimeConfig } from "./runtimeConfig";

import type {
  PrototypeAppKey,
  PrototypeAppSummary,
  PrototypeDashboardSummaryData,
  PrototypeDraftMutationResult,
  PrototypeSubmissionSummaryDownload,
  PrototypeSubmitResult,
  PrototypeUploadedDocument,
  PrototypeUploadPolicy,
  PrototypeWorkflowData
} from "../index";
import type { FrontendDataSource, FrontendRuntimeConfig } from "./runtimeConfig";

export interface AppShellData {
  app: PrototypeAppSummary;
  backendBoundary: "server-only";
  dataSource: FrontendDataSource;
}

function getRuntimeConfig(config?: FrontendRuntimeConfig): FrontendRuntimeConfig {
  return config ?? resolveFrontendRuntimeConfig();
}

function createAppShellData(key: PrototypeAppKey, config?: FrontendRuntimeConfig): AppShellData {
  const runtimeConfig = getRuntimeConfig(config);

  if (runtimeConfig.dataSource === "backend") {
    return createBackendAppShellData(key);
  }

  return createMockAppShellData(key);
}

export async function getDashboardShellData(config?: FrontendRuntimeConfig): Promise<AppShellData> {
  return createAppShellData("dashboard", config);
}

export async function getSeniorsCardShellData(config?: FrontendRuntimeConfig): Promise<AppShellData> {
  return createAppShellData("seniors-card", config);
}

export async function getRentalSecuritySubsidyShellData(config?: FrontendRuntimeConfig): Promise<AppShellData> {
  return createAppShellData("rental-security-subsidy", config);
}

export async function getDashboardSummaryData(config?: FrontendRuntimeConfig): Promise<PrototypeDashboardSummaryData> {
  const runtimeConfig = getRuntimeConfig(config);

  if (runtimeConfig.dataSource === "backend") {
    throw new Error("Backend dashboard summary data is not implemented in the frontend service layer yet.");
  }

  return getMockDashboardSummaryData();
}

export async function getSeniorsCardWorkflowData(config?: FrontendRuntimeConfig): Promise<PrototypeWorkflowData> {
  const runtimeConfig = getRuntimeConfig(config);

  if (runtimeConfig.dataSource === "backend") {
    throw new Error("Backend Seniors Card workflow data is not implemented in the frontend service layer yet.");
  }

  return getMockSeniorsCardWorkflowData();
}

export async function getRentalSecuritySubsidyWorkflowData(config?: FrontendRuntimeConfig): Promise<PrototypeWorkflowData> {
  const runtimeConfig = getRuntimeConfig(config);

  if (runtimeConfig.dataSource === "backend") {
    throw new Error("Backend rental subsidy workflow data is not implemented in the frontend service layer yet.");
  }

  return getMockRentalSecuritySubsidyWorkflowData();
}

export async function createTransactionDraft(
  appKey: Exclude<PrototypeAppKey, "dashboard">,
  config?: FrontendRuntimeConfig
): Promise<PrototypeDraftMutationResult> {
  const runtimeConfig = getRuntimeConfig(config);

  if (runtimeConfig.dataSource === "backend") {
    throw new Error("Backend draft creation is not implemented in the frontend service layer yet.");
  }

  return createMockDraft(appKey);
}

export async function updateTransactionDraftWithValidationError(
  appKey: Exclude<PrototypeAppKey, "dashboard">,
  config?: FrontendRuntimeConfig
): Promise<PrototypeDraftMutationResult> {
  const runtimeConfig = getRuntimeConfig(config);

  if (runtimeConfig.dataSource === "backend") {
    throw new Error("Backend draft validation is not implemented in the frontend service layer yet.");
  }

  return updateMockDraftWithValidationError(appKey);
}

export async function submitTransactionDraft(
  appKey: Exclude<PrototypeAppKey, "dashboard">,
  config?: FrontendRuntimeConfig
): Promise<PrototypeSubmitResult> {
  const runtimeConfig = getRuntimeConfig(config);

  if (runtimeConfig.dataSource === "backend") {
    throw new Error("Backend draft submission is not implemented in the frontend service layer yet.");
  }

  return submitMockDraft(appKey);
}

export async function getSupportingDocumentUploadPolicy(config?: FrontendRuntimeConfig): Promise<PrototypeUploadPolicy> {
  const runtimeConfig = getRuntimeConfig(config);

  if (runtimeConfig.dataSource === "backend") {
    throw new Error("Backend upload policy reads are not implemented in the frontend service layer yet.");
  }

  return getMockSupportingDocumentUploadPolicy();
}

export async function getUploadedDocuments(
  appKey: Exclude<PrototypeAppKey, "dashboard">,
  config?: FrontendRuntimeConfig
): Promise<PrototypeUploadedDocument[]> {
  const runtimeConfig = getRuntimeConfig(config);

  if (runtimeConfig.dataSource === "backend") {
    throw new Error("Backend uploaded document reads are not implemented in the frontend service layer yet.");
  }

  return getMockUploadedDocuments(appKey);
}

export async function getSubmissionSummaryDownload(
  appKey: Exclude<PrototypeAppKey, "dashboard">,
  referenceNumber: string,
  config?: FrontendRuntimeConfig
): Promise<PrototypeSubmissionSummaryDownload> {
  const runtimeConfig = getRuntimeConfig(config);

  if (runtimeConfig.dataSource === "backend") {
    throw new Error("Backend submission summary downloads are not implemented in the frontend service layer yet.");
  }

  return getMockSubmissionSummaryDownload(appKey, referenceNumber);
}
