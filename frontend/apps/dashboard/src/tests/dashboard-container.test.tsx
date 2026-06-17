import { createPrototypeAppSummary } from "@ssq/services";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { DashboardContent } from "../containers/DashboardHomeContainer";

import type { AppShellData } from "@ssq/services/server";
import type { PrototypeDashboardSummaryData } from "@ssq/services";

const shell: AppShellData = {
  app: createPrototypeAppSummary("dashboard"),
  backendBoundary: "server-only",
  dataSource: "mock"
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
