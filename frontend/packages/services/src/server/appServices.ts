import "server-only";

import { createPrototypeAppSummary } from "../index";

import type { PrototypeAppKey, PrototypeAppSummary } from "../index";

export interface AppShellData {
  app: PrototypeAppSummary;
  backendBoundary: "server-only";
}

function createAppShellData(key: PrototypeAppKey): AppShellData {
  return {
    app: createPrototypeAppSummary(key),
    backendBoundary: "server-only"
  };
}

export async function getDashboardShellData(): Promise<AppShellData> {
  return createAppShellData("dashboard");
}

export async function getSeniorsCardShellData(): Promise<AppShellData> {
  return createAppShellData("seniors-card");
}

export async function getRentalSecuritySubsidyShellData(): Promise<AppShellData> {
  return createAppShellData("rental-security-subsidy");
}
