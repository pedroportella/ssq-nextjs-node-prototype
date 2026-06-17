import { createPrototypeAppSummary } from "@ssq/services";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { DashboardContent } from "../containers/DashboardHomeContainer";
import { UILibraryShowcaseContent } from "../containers/UILibraryShowcaseContainer";
import {
  parseReviewerQueueFilters,
  ReviewerQueueContent,
  ReviewerRequestDetailContent
} from "../containers/ReviewerQueueContainer";
import { OperationsPanelContent } from "../containers/OperationsPanelContainer";

import type { AppShellData } from "@ssq/services/server";
import type {
  PrototypeDashboardSummaryData,
  PrototypeOperationsPostureResult,
  PrototypeReviewerQueueData,
  PrototypeReviewerRequestDetailData
} from "@ssq/services";

const shell: AppShellData = {
  app: createPrototypeAppSummary("dashboard"),
  backendBoundary: "server-only",
  dataSource: "mock",
  session: {
    capabilities: {
      canAccessCitizenServices: true,
      canReadOperations: false,
      canReviewSubmittedRequests: false
    },
    displayName: "Avery Taylor",
    identityStrength: "verified",
    roles: ["Citizen"],
    signedIn: true,
    source: "MOCK",
    subject: "avery.taylor@example.test"
  }
};

const staffShell: AppShellData = {
  ...shell,
  session: {
    capabilities: {
      canAccessCitizenServices: false,
      canReadOperations: false,
      canReviewSubmittedRequests: true
    },
    displayName: "ServiceOfficer officer@example.test",
    identityStrength: "basic",
    roles: ["ServiceOfficer"],
    signedIn: true,
    source: "MOCK",
    subject: "officer@example.test"
  }
};

const adminShell: AppShellData = {
  ...shell,
  session: {
    capabilities: {
      canAccessCitizenServices: false,
      canReadOperations: true,
      canReviewSubmittedRequests: true
    },
    displayName: "Admin admin@example.test",
    identityStrength: "basic",
    roles: ["Admin"],
    signedIn: true,
    source: "MOCK",
    subject: "admin@example.test"
  }
};

const summary: PrototypeDashboardSummaryData = {
  activity: [
    {
      at: "2026-06-12T02:15:00.000Z",
      description: "SC-2026-0001 submitted",
      status: "APPROVED"
    }
  ],
  availableServices: [
    {
      appKey: "seniors-card",
      description: "Check eligibility.",
      href: "https://example.test/seniors-card",
      label: "Seniors Card",
      status: "available"
    },
    {
      appKey: "rental-security-subsidy",
      description: "Apply for rental support.",
      href: "https://example.test/rental-security-subsidy",
      label: "Rental Security Subsidy",
      status: "available"
    }
  ],
  drafts: [
    {
      appKey: "seniors-card",
      draftId: "seniors-card-draft-001",
      lastUpdated: "2026-06-12T01:30:00.000Z",
      status: "DRAFT",
      title: "Seniors Card"
    }
  ],
  profile: {
    displayName: "Avery Taylor",
    email: "avery.taylor@example.test",
    identityStrength: "verified"
  },
  submittedRequests: [
    {
      appKey: "seniors-card",
      referenceNumber: "SC-2026-0001",
      status: "APPROVED",
      submittedAt: "2026-06-12T02:15:00.000Z",
      supportingDocuments: [
        {
          category: "Identity evidence",
          downloadHref: "/service-requests/SC-2026-0001/supporting-documents/mock-sc-identity-evidence/download",
          fileName: "identity-evidence.pdf",
          id: "mock-sc-identity-evidence",
          mimeType: "application/pdf",
          personKey: "applicant",
          sizeBytes: 512_000,
          status: "uploaded"
        }
      ],
      title: "Seniors Card"
    },
    {
      appKey: "rental-security-subsidy",
      referenceNumber: "RSS-2026-0001",
      status: "IN_REVIEW",
      submittedAt: "2026-06-12T02:15:00.000Z",
      supportingDocuments: [
        {
          category: "Rental evidence",
          downloadHref: "/service-requests/RSS-2026-0001/supporting-documents/mock-rss-rental-evidence/download",
          fileName: "rental-property-evidence.pdf",
          id: "mock-rss-rental-evidence",
          mimeType: "application/pdf",
          personKey: "applicant",
          sizeBytes: 512_000,
          status: "uploaded"
        },
        {
          category: "Income evidence",
          downloadHref: "/service-requests/RSS-2026-0001/supporting-documents/mock-rss-income-evidence/download",
          fileName: "household-income-evidence.pdf",
          id: "mock-rss-income-evidence",
          mimeType: "application/pdf",
          personKey: "household-member",
          sizeBytes: 384_000,
          status: "uploaded"
        }
      ],
      title: "Rental Security Subsidy"
    }
  ]
};

const operationsResult: PrototypeOperationsPostureResult = {
  ok: true,
  posture: {
    generatedAt: "2026-06-17T00:00:00.000Z",
    nextActions: [
      {
        code: "OUTBOX_PENDING",
        message: "Process or review pending outbox handoff events.",
        severity: "WARN"
      }
    ],
    service: {
      environment: "development",
      name: "ssq-node-api",
      version: "0.0.0"
    },
    signals: {
      database: {
        status: "OK"
      },
      featureFlags: {
        disabled: 1,
        enabled: 1,
        flags: [
          {
            enabled: true,
            key: "transaction.seniors-card.enabled"
          },
          {
            enabled: false,
            key: "transaction.rental-security-subsidy.enabled"
          }
        ],
        status: "WARN"
      },
      hardening: {
        corsAllowedOrigins: 1,
        debugRoutesEnabled: false,
        hstsEnabled: false,
        rateLimitEnabled: true,
        rateLimitMax: 120,
        rateLimitWindowMs: 60_000,
        status: "OK"
      },
      migrations: {
        appliedCount: 9,
        availableCount: 9,
        latestApplied: "009_service_request_queue_assignment.sql",
        latestAvailable: "009_service_request_queue_assignment.sql",
        status: "OK"
      },
      outbox: {
        status: "WARN",
        summary: {
          byEventType: [
            {
              eventType: "SERVICE_REQUEST_SUBMITTED",
              statuses: {
                PENDING: 2,
                PROCESSED: 1
              }
            }
          ],
          totals: {
            failed: 0,
            pending: 2,
            processed: 1
          }
        }
      },
      runtime: {
        status: "OK"
      },
      seededData: {
        latestAvailableSeed: "001_demo_customer.sql",
        seedFileCount: 1,
        status: "OK"
      }
    },
    status: "DEGRADED"
  }
};

describe("DashboardContent", () => {
  it("renders mock-seeded dashboard services and configured links", () => {
    const html = renderToStaticMarkup(<DashboardContent shell={shell} summary={summary} />);

    expect(html).toContain("SSQ Service Dashboard");
    expect(html).toContain("qld__grid");
    expect(html).toContain("vertical-nav");
    expect(html).toContain("container-fluid");
    expect(html).toContain("ssq-layout__container");
    expect(html).toContain("qld__left-nav");
    expect(html).toContain("qld__left-nav__content");
    expect(html).toContain("qld__left-nav__item-link");
    expect(html).toContain("qld__left-nav__item-text");
    expect(html).toContain("qld__left-nav__item-icon");
    expect(html).toContain("qld__accordion--open");
    expect(html).toContain("qld__body--left-nav");
    expect(html).toContain('aria-label="Dashboard navigation"');
    expect(html).toContain('aria-current="page"');
    expect(html).toContain('href="#available-services"');
    expect(html).toContain('href="#current-records"');
    expect(html).toContain('href="#recent-activity"');
    expect(html).not.toContain("Staff review");
    expect(html).not.toContain("Operations");
    expect(html).toContain("ssq-layout__content--full");
    expect(html).toContain('aria-labelledby="page-title"');
    expect(html).toContain("row");
    expect(html).toContain("ssq-page-header");
    expect(html).toContain("ssq-content-section");
    expect(html).toContain("qld__summary-list");
    expect(html).toContain("qld__table");
    expect(html).toContain("Dashboard summary");
    expect(html).toContain("Current records");
    expect(html).toContain("Avery Taylor");
    expect(html).toContain("Prototype review data");
    expect(html).toContain("Seniors Card");
    expect(html).toContain('href="https://example.test/seniors-card"');
    expect(html).toContain("Rental Security Subsidy");
    expect(html).toContain('href="https://example.test/rental-security-subsidy"');
    expect(html).toContain("Saved drafts");
    expect(html).toContain("Submitted requests");
    expect(html).toContain("SC-2026-0001");
    expect(html).toContain("RSS-2026-0001");
    expect(html).toContain("Files");
    expect(html).toContain("identity-evidence.pdf");
    expect(html).toContain("rental-property-evidence.pdf");
    expect(html).toContain("household-income-evidence.pdf");
    expect(html).toContain(
      'href="https://example.test/seniors-card/service-requests/SC-2026-0001/supporting-documents/mock-sc-identity-evidence/download"'
    );
    expect(html).toContain(
      'href="https://example.test/rental-security-subsidy/service-requests/RSS-2026-0001/supporting-documents/mock-rss-rental-evidence/download"'
    );
  });

  it("renders staff review navigation for reviewer sessions", () => {
    const html = renderToStaticMarkup(<DashboardContent shell={staffShell} summary={summary} />);

    expect(html).toContain("Staff review");
    expect(html).toContain('href="/reviewer"');
    expect(html).toContain("ServiceOfficer officer@example.test");
    expect(html).toContain("No services are available right now.");
  });

  it("renders operations navigation for admin sessions", () => {
    const html = renderToStaticMarkup(<DashboardContent shell={adminShell} summary={summary} />);

    expect(html).toContain("Staff review");
    expect(html).toContain("Operations");
    expect(html).toContain('href="/operations"');
    expect(html).toContain("Admin admin@example.test");
  });

  it("renders safe empty states when dashboard data is missing", () => {
    const html = renderToStaticMarkup(
      <DashboardContent
        shell={shell}
        summary={{
          ...summary,
          activity: [],
          availableServices: [],
          drafts: [],
          submittedRequests: []
        }}
      />
    );

    expect(html).toContain("No services are available right now.");
    expect(html).toContain("No saved drafts.");
    expect(html).toContain("No submitted requests.");
    expect(html).toContain("No recent activity to show.");
  });
});

describe("UILibraryShowcaseContent", () => {
  it("renders component states for design review", () => {
    const html = renderToStaticMarkup(<UILibraryShowcaseContent />);

    expect(html).toContain("UI Library showcase");
    expect(html).toContain("Alerts and actions");
    expect(html).toContain("Form states");
    expect(html).toContain("Upload states");
    expect(html).toContain("Navigation and disclosure");
    expect(html).toContain("Data display");
    expect(html).toContain("Workflow states");
    expect(html).toContain("Disabled action");
    expect(html).toContain("Enter a date in YYYY-MM-DD format.");
    expect(html).toContain("oversized-income-evidence.pdf");
    expect(html).toContain("income-evidence.zip");
    expect(html).toContain("No submitted requests found.");
    expect(html).toContain('aria-busy="true"');
  });
});

describe("OperationsPanelContent", () => {
  it("renders operations posture for admin sessions", () => {
    const html = renderToStaticMarkup(<OperationsPanelContent result={operationsResult} shell={adminShell} />);

    expect(html).toContain("Operations Degraded");
    expect(html).toContain("Operations summary");
    expect(html).toContain("ssq-node-api");
    expect(html).toContain("System signals");
    expect(html).toContain("Outbox");
    expect(html).toContain("Pending");
    expect(html).toContain("SERVICE_REQUEST_SUBMITTED");
    expect(html).toContain("Feature flags");
    expect(html).toContain("transaction.rental-security-subsidy.enabled");
    expect(html).toContain("Next actions");
    expect(html).toContain("OUTBOX_PENDING");
  });

  it("renders admin-required state for non-admin sessions", () => {
    const html = renderToStaticMarkup(<OperationsPanelContent shell={shell} />);

    expect(html).toContain("Admin access required");
    expect(html).not.toContain("Operations summary");
    expect(html).not.toContain("System signals");
  });

  it("renders unavailable posture for admin sessions", () => {
    const html = renderToStaticMarkup(
      <OperationsPanelContent
        result={{
          error: {
            code: "OPERATIONS_UNAVAILABLE",
            message: "Posture endpoint is unavailable."
          },
          ok: false
        }}
        shell={adminShell}
      />
    );

    expect(html).toContain("Operations posture unavailable");
    expect(html).toContain("Posture endpoint is unavailable.");
    expect(html).toContain("OPERATIONS_UNAVAILABLE");
  });
});

const reviewerQueue: PrototypeReviewerQueueData = {
  canReview: true,
  filters: {
    page: 1,
    status: "SUBMITTED"
  },
  pageInfo: {
    page: 1,
    pageSize: 20,
    totalItems: 1,
    totalPages: 1
  },
  requests: [
    {
      appKey: "seniors-card",
      assignedTeam: "Seniors Card",
      id: "30000000-0000-4000-8000-000000000001",
      referenceNumber: "SC-2026-0001",
      status: "SUBMITTED",
      submittedAt: "2026-06-12T02:15:00.000Z",
      title: "Seniors Card"
    }
  ],
  reviewerRole: "ServiceOfficer",
  reviewerSubject: "officer@example.test",
  statusCounts: [
    {
      count: 1,
      status: "SUBMITTED"
    }
  ]
};

const reviewerDetail: PrototypeReviewerRequestDetailData = {
  activity: [
    {
      at: "2026-06-12T02:15:00.000Z",
      description: "SC-2026-0001 submitted"
    }
  ],
  canReview: true,
  payloadItems: [
    {
      label: "Date Of Birth",
      value: "1960-01-01"
    }
  ],
  request: reviewerQueue.requests[0],
  reviewerRole: "ServiceOfficer",
  reviewerSubject: "officer@example.test",
  supportingDocuments: [
    {
      category: "Identity evidence",
      downloadHref: "/service-requests/SC-2026-0001/supporting-documents/mock-sc-identity-evidence/download",
      fileName: "identity-evidence.pdf",
      id: "mock-sc-identity-evidence",
      sizeBytes: 512_000,
      status: "uploaded"
    }
  ]
};

describe("Reviewer queue containers", () => {
  it("parses reviewer queue filters from search params", () => {
    expect(parseReviewerQueueFilters({
      page: "2",
      search: " SC ",
      status: "SUBMITTED"
    })).toEqual({
      page: 2,
      search: "SC",
      sortBy: "createdAt",
      sortDirection: "DESC",
      status: "SUBMITTED"
    });
  });

  it("renders the reviewer queue with filters, selection and batch action controls", () => {
    const html = renderToStaticMarkup(<ReviewerQueueContent queue={reviewerQueue} shell={staffShell} />);

    expect(html).toContain("Reviewer queue");
    expect(html).toContain("Search queue");
    expect(html).toContain("Submitted request queue");
    expect(html).toContain('href="/reviewer/SC-2026-0001"');
    expect(html).toContain('aria-label="Select SC-2026-0001"');
    expect(html).toContain('form="reviewer-batch-form"');
    expect(html).toContain('action="/reviewer/actions/batch-status"');
    expect(html).toContain("Batch transition");
    expect(html).toContain("Reason");
  });

  it("renders a clear unauthorized reviewer state without staff controls", () => {
    const html = renderToStaticMarkup(
      <ReviewerQueueContent
        queue={{
          ...reviewerQueue,
          canReview: false
        }}
        shell={shell}
      />
    );

    expect(html).toContain("Staff access required");
    expect(html).not.toContain("Batch transition");
    expect(html).not.toContain('action="/reviewer/actions/batch-status"');
  });

  it("renders reviewer detail with payload, documents, assignment and activity", () => {
    const html = renderToStaticMarkup(<ReviewerRequestDetailContent detail={reviewerDetail} shell={staffShell} />);

    expect(html).toContain("Review submitted request details and supporting evidence.");
    expect(html).toContain("SC-2026-0001");
    expect(html).toContain("Payload summary");
    expect(html).toContain("Date Of Birth");
    expect(html).toContain("identity-evidence.pdf");
    expect(html).toContain(
      'href="http://localhost:3001/service-requests/SC-2026-0001/supporting-documents/mock-sc-identity-evidence/download"'
    );
    expect(html).toContain('action="/reviewer/actions/assign"');
    expect(html).toContain("Activity history");
  });
});
