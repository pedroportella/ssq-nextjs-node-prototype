import { describe, expect, it } from "vitest";

import {
  createTransactionDraft,
  getDashboardShellData,
  getDashboardSummaryData,
  getRentalSecuritySubsidyShellData,
  getRentalSecuritySubsidyWorkflowData,
  getSeniorsCardShellData,
  getSeniorsCardWorkflowData,
  submitTransactionDraft,
  updateTransactionDraftWithValidationError
} from "./index";

describe("server app services", () => {
  it("returns dashboard shell data", async () => {
    await expect(getDashboardShellData()).resolves.toMatchObject({
      app: {
        key: "dashboard",
        status: "UP"
      },
      backendBoundary: "server-only",
      dataSource: "mock"
    });
  });

  it("returns transaction app shell data", async () => {
    await expect(getSeniorsCardShellData()).resolves.toMatchObject({
      app: {
        key: "seniors-card"
      }
    });
    await expect(getRentalSecuritySubsidyShellData()).resolves.toMatchObject({
      app: {
        key: "rental-security-subsidy"
      }
    });
  });

  it("can return backend shell metadata when backend mode is configured", async () => {
    await expect(getDashboardShellData({ backendUrl: "http://backend:7001", dataSource: "backend" })).resolves.toMatchObject({
      app: {
        key: "dashboard"
      },
      dataSource: "backend"
    });
  });

  it("returns typed mock dashboard summary data", async () => {
    await expect(getDashboardSummaryData({ dataSource: "mock" })).resolves.toMatchObject({
      availableServices: [
        {
          appKey: "seniors-card",
          href: "http://localhost:3001"
        },
        {
          appKey: "rental-security-subsidy",
          href: "http://localhost:3002"
        }
      ],
      drafts: [
        {
          appKey: "seniors-card",
          status: "DRAFT"
        }
      ],
      profile: {
        identityStrength: "verified"
      },
      submittedRequests: expect.arrayContaining([
        expect.objectContaining({
          referenceNumber: "SC-2026-0001"
        })
      ])
    });
  });

  it("returns typed mock workflow data for both transaction apps", async () => {
    await expect(getSeniorsCardWorkflowData({ dataSource: "mock" })).resolves.toMatchObject({
      app: {
        key: "seniors-card"
      },
      draft: {
        draftId: "seniors-card-draft-001"
      },
      validationErrors: [
        {
          fieldPath: "eligibility.dateOfBirth"
        }
      ]
    });
    await expect(getRentalSecuritySubsidyWorkflowData({ dataSource: "mock" })).resolves.toMatchObject({
      app: {
        key: "rental-security-subsidy"
      },
      submittedRequest: {
        referenceNumber: "RSS-2026-0001"
      }
    });
  });

  it("returns deterministic mock draft and submit responses", async () => {
    await expect(createTransactionDraft("seniors-card", { dataSource: "mock" })).resolves.toMatchObject({
      draft: {
        draftId: "seniors-card-draft-001"
      },
      validationErrors: []
    });
    await expect(updateTransactionDraftWithValidationError("seniors-card", { dataSource: "mock" })).resolves.toMatchObject({
      validationErrors: [
        {
          fieldPath: "eligibility.dateOfBirth"
        }
      ]
    });
    await expect(submitTransactionDraft("seniors-card", { dataSource: "mock" })).resolves.toMatchObject({
      referenceNumber: "SC-2026-0001",
      summary: {
        filename: "sc-2026-0001-summary.txt"
      }
    });
  });
});
