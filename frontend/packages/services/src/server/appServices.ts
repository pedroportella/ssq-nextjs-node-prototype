import "server-only";

import {
  createBackendAppShellData,
  createBackendTransactionDraft,
  getBackendDashboardSummaryData,
  getBackendSubmissionSummaryDownload,
  getBackendSupportingDocumentUploadPolicy,
  getBackendUploadedDocuments,
  getBackendWorkflowData,
  recordBackendSupportingDocumentUploadMetadata,
  submitBackendTransactionDraft,
  updateBackendDraftWithValidationError
} from "./backendServices";
import {
  createMockAppShellData,
  createMockDraft,
  getMockDashboardSummaryData,
  getMockSubmissionSummaryDownload,
  getMockSupportingDocumentUploadPolicy,
  getMockUploadedDocuments,
  getMockRentalSecuritySubsidyWorkflowData,
  getMockSeniorsCardWorkflowData,
  recordMockSupportingDocumentUploadMetadata,
  submitMockDraft,
  updateMockDraftWithValidationError
} from "./mockServices";
import { resolveFrontendRuntimeConfig } from "./runtimeConfig";

import type {
  PrototypeAppKey,
  PrototypeAppSummary,
  PrototypeDashboardSummaryData,
  PrototypeDraftMutationResult,
  PrototypeSupportingDocumentUploadInput,
  PrototypeSupportingDocumentUploadResult,
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
    return getBackendDashboardSummaryData(runtimeConfig);
  }

  return getMockDashboardSummaryData();
}

export async function getSeniorsCardWorkflowData(config?: FrontendRuntimeConfig): Promise<PrototypeWorkflowData> {
  const runtimeConfig = getRuntimeConfig(config);

  if (runtimeConfig.dataSource === "backend") {
    return getBackendWorkflowData("seniors-card", runtimeConfig);
  }

  return getMockSeniorsCardWorkflowData();
}

export async function getRentalSecuritySubsidyWorkflowData(config?: FrontendRuntimeConfig): Promise<PrototypeWorkflowData> {
  const runtimeConfig = getRuntimeConfig(config);

  if (runtimeConfig.dataSource === "backend") {
    return getBackendWorkflowData("rental-security-subsidy", runtimeConfig);
  }

  return getMockRentalSecuritySubsidyWorkflowData();
}

export async function createTransactionDraft(
  appKey: Exclude<PrototypeAppKey, "dashboard">,
  config?: FrontendRuntimeConfig
): Promise<PrototypeDraftMutationResult> {
  const runtimeConfig = getRuntimeConfig(config);

  if (runtimeConfig.dataSource === "backend") {
    return createBackendTransactionDraft(appKey, runtimeConfig);
  }

  return createMockDraft(appKey);
}

export async function updateTransactionDraftWithValidationError(
  appKey: Exclude<PrototypeAppKey, "dashboard">,
  config?: FrontendRuntimeConfig
): Promise<PrototypeDraftMutationResult> {
  const runtimeConfig = getRuntimeConfig(config);

  if (runtimeConfig.dataSource === "backend") {
    return updateBackendDraftWithValidationError(appKey, runtimeConfig);
  }

  return updateMockDraftWithValidationError(appKey);
}

export async function submitTransactionDraft(
  appKey: Exclude<PrototypeAppKey, "dashboard">,
  config?: FrontendRuntimeConfig
): Promise<PrototypeSubmitResult> {
  const runtimeConfig = getRuntimeConfig(config);

  if (runtimeConfig.dataSource === "backend") {
    return submitBackendTransactionDraft(appKey, runtimeConfig);
  }

  return submitMockDraft(appKey);
}

export async function getSupportingDocumentUploadPolicy(config?: FrontendRuntimeConfig): Promise<PrototypeUploadPolicy> {
  const runtimeConfig = getRuntimeConfig(config);

  if (runtimeConfig.dataSource === "backend") {
    return getBackendSupportingDocumentUploadPolicy();
  }

  return getMockSupportingDocumentUploadPolicy();
}

export async function getUploadedDocuments(
  appKey: Exclude<PrototypeAppKey, "dashboard">,
  config?: FrontendRuntimeConfig
): Promise<PrototypeUploadedDocument[]> {
  const runtimeConfig = getRuntimeConfig(config);

  if (runtimeConfig.dataSource === "backend") {
    return getBackendUploadedDocuments(appKey, runtimeConfig);
  }

  return getMockUploadedDocuments(appKey);
}

export async function recordSupportingDocumentUploadMetadata(
  input: PrototypeSupportingDocumentUploadInput,
  config?: FrontendRuntimeConfig
): Promise<PrototypeSupportingDocumentUploadResult> {
  const runtimeConfig = getRuntimeConfig(config);

  if (runtimeConfig.dataSource === "backend") {
    return recordBackendSupportingDocumentUploadMetadata(input, runtimeConfig);
  }

  return recordMockSupportingDocumentUploadMetadata(input);
}

export async function getSubmissionSummaryDownload(
  appKey: Exclude<PrototypeAppKey, "dashboard">,
  referenceNumber: string,
  config?: FrontendRuntimeConfig
): Promise<PrototypeSubmissionSummaryDownload> {
  const runtimeConfig = getRuntimeConfig(config);

  if (runtimeConfig.dataSource === "backend") {
    return getBackendSubmissionSummaryDownload(appKey, referenceNumber, runtimeConfig);
  }

  return getMockSubmissionSummaryDownload(appKey, referenceNumber);
}
