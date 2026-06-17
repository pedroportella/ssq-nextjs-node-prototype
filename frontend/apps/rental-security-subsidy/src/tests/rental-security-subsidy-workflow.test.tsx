import { createPrototypeAppSummary } from "@ssq/services";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { RentalSecuritySubsidyApplyContent } from "../containers/RentalSecuritySubsidyApplyContainer";
import { RentalSecuritySubsidyOverviewContent } from "../containers/RentalSecuritySubsidyOverviewContainer";
import { RentalSecuritySubsidyStatusContent } from "../containers/RentalSecuritySubsidyStatusContainer";

import type {
  PrototypeDraftMutationResult,
  PrototypeSubmitResult,
  PrototypeWorkflowData
} from "@ssq/services";
import type { AppShellData } from "@ssq/services/server";

const shell: AppShellData = {
  app: createPrototypeAppSummary("rental-security-subsidy"),
  backendBoundary: "server-only",
  dataSource: "mock"
};

const workflow: PrototypeWorkflowData = {
  activity: [
    {
      at: "2026-06-12T01:30:00.000Z",
      description: "Draft saved",
      status: "DRAFT"
    },
    {
      at: "2026-06-12T02:15:00.000Z",
      description: "RSS-2026-0001 submitted",
      status: "IN_REVIEW"
    }
  ],
  app: createPrototypeAppSummary("rental-security-subsidy"),
  draft: {
    appKey: "rental-security-subsidy",
    draftId: "rental-security-subsidy-draft-001",
    lastUpdated: "2026-06-12T01:30:00.000Z",
    status: "DRAFT",
    title: "Rental Security Subsidy"
  },
  profile: {
    displayName: "Avery Taylor",
    email: "avery.taylor@example.test",
    identityStrength: "verified"
  },
  submittedRequest: {
    appKey: "rental-security-subsidy",
    referenceNumber: "RSS-2026-0001",
    status: "IN_REVIEW",
    submittedAt: "2026-06-12T02:15:00.000Z",
    title: "Rental Security Subsidy"
  },
  supportingDocuments: [
    {
      category: "Rental evidence",
      downloadHref: "/service-requests/RSS-2026-0001/supporting-documents/mock-rss-rental-evidence/download",
      fileName: "rental-property-evidence.pdf",
      id: "mock-rss-rental-evidence",
      sizeBytes: 512_000,
      status: "uploaded"
    },
    {
      category: "Income evidence",
      downloadHref: "/service-requests/RSS-2026-0001/supporting-documents/mock-rss-income-evidence/download",
      fileName: "household-income-evidence.pdf",
      id: "mock-rss-income-evidence",
      personKey: "household-member",
      sizeBytes: 384_000,
      status: "uploaded"
    },
    {
      category: "Rejected example",
      fileName: "rental-property-archive.zip",
      message: "Upload a PDF, JPG or PNG file under 5 MB.",
      sizeBytes: 14_000_000,
      status: "rejected"
    }
  ],
  uploadPolicy: {
    acceptedFileTypes: ["application/pdf", "image/jpeg", "image/png"],
    allowedCategories: [
      { hint: "Documents that prove the applicant's name or age.", label: "Identity evidence", value: "identity" },
      { hint: "Documents that show the applicant lives in Queensland.", label: "Residency evidence", value: "residency" },
      { hint: "Payslips, statements or other income evidence.", label: "Income evidence", value: "income" },
      { hint: "Service-specific documents requested during assessment.", label: "Supporting evidence", value: "supporting-evidence" }
    ],
    defaultPersonKey: "applicant",
    maxFileSizeBytes: 5 * 1024 * 1024,
    maxFilesPerPerson: 5,
    maxTotalSizeBytesPerPerson: 10 * 1024 * 1024,
    rejectedExample: {
      fieldPath: "supportingDocuments[0].file",
      message: "Upload a PDF, JPG or PNG file under 5 MB."
    }
  },
  validationErrors: [
    {
      fieldPath: "rentalProperty.weeklyRent",
      message: "Enter the weekly rent amount for the property."
    }
  ]
};

const createdDraft: PrototypeDraftMutationResult = {
  draft: workflow.draft,
  validationErrors: []
};

const validationResult: PrototypeDraftMutationResult = {
  draft: workflow.draft,
  validationErrors: workflow.validationErrors
};

const submitResult: PrototypeSubmitResult = {
  activity: workflow.activity,
  referenceNumber: "RSS-2026-0001",
  status: "IN_REVIEW",
  summary: {
    filename: "rss-2026-0001-summary.txt",
    href: "/service-requests/RSS-2026-0001/summary/download",
    referenceNumber: "RSS-2026-0001"
  }
};

describe("Rental Security Subsidy workflow containers", () => {
  it("renders the landing page with side navigation and application entry points", () => {
    const html = renderToStaticMarkup(<RentalSecuritySubsidyOverviewContent shell={shell} workflow={workflow} />);

    expect(html).toContain("Rental Security Subsidy");
    expect(html).toContain("qld__grid");
    expect(html).toContain("vertical-nav");
    expect(html).toContain("qld__left-nav");
    expect(html).toContain("qld__left-nav__content");
    expect(html).toContain("qld__left-nav__item-link");
    expect(html).toContain("qld__left-nav__item-text");
    expect(html).toContain("qld__left-nav__item-icon");
    expect(html).toContain('aria-label="Rental Security Subsidy navigation"');
    expect(html).toContain('aria-current="page"');
    expect(html).toContain('href="/#about-service"');
    expect(html).toContain('href="/#eligibility"');
    expect(html).toContain('href="/#before-you-start"');
    expect(html).toContain('href="/apply"');
    expect(html).toContain('href="/application-status"');
    expect(html).toContain('id="about-service"');
    expect(html).toContain('id="eligibility"');
    expect(html).toContain('id="before-you-start"');
    expect(html).toContain('id="start-application"');
    expect(html).toContain("container-fluid");
    expect(html).toContain("ssq-layout__container");
    expect(html).toContain("ssq-layout__content--full");
    expect(html).toContain('aria-labelledby="page-title"');
    expect(html).toContain("row");
    expect(html).toContain("ssq-page-header");
    expect(html).toContain("ssq-content-section");
    expect(html).toContain("qld__summary-list");
    expect(html).toContain("Prototype rental workflow");
    expect(html).toContain("About this service");
    expect(html).toContain("Before you start");
    expect(html).toContain("The next step opens the multistep form without the landing page side navigation.");
    expect(html).toContain("rental-security-subsidy-draft-001");
  });

  it("renders the apply workflow with rental-property validation and submit result", () => {
    const html = renderToStaticMarkup(
      <RentalSecuritySubsidyApplyContent
        createdDraft={createdDraft}
        submitResult={submitResult}
        validationResult={validationResult}
        workflow={workflow}
      />
    );

    expect(html).toContain("Prepare your rental support application");
    expect(html).toContain("qld__grid");
    expect(html).toContain("ssq-layout--focus");
    expect(html).not.toContain("vertical-nav");
    expect(html).not.toContain("qld__left-nav");
    expect(html).toContain("container-fluid");
    expect(html).toContain("ssq-layout__content--task");
    expect(html).toContain("row");
    expect(html).not.toContain("qld__card");
    expect(html).not.toContain("ssq-card");
    expect(html).toContain("qld__form");
    expect(html).toContain("<fieldset");
    expect(html).toContain("About you");
    expect(html).toContain("Household and income");
    expect(html).toContain("Evidence");
    expect(html).toContain("qld__direction-link");
    expect(html).toContain("Back to Rental Security Subsidy landing page");
    expect(html).toContain("Back to landing page");
    expect(html).toContain("qld__progress-indicator");
    expect(html).toContain("qld__progress-indicator__item--current");
    expect(html).toContain("ssq-categorized-upload");
    expect(html).toContain('id="rental-evidence-applicant-upload"');
    expect(html).toContain('id="rental-evidence-household-member-upload"');
    expect(html).toContain('name="rentalEvidence[applicant][]"');
    expect(html).toContain('name="rentalEvidence[household-member][]"');
    expect(html).toContain('accept="application/pdf,image/jpeg,image/png"');
    expect(html).toContain("Attach rental, income or identity evidence and assign each file to the right person.");
    expect(html).toContain("Maximum 5 files and 10.0 MB total per person.");
    expect(html).toContain("qld__form-group");
    expect(html).toContain("qld__select");
    expect(html).toContain("qld__select-control");
    expect(html).toContain('id="support-type"');
    expect(html).toContain('<option value="bond" selected="">Bond assistance</option>');
    expect(html).toContain("qld__radio-buttons");
    expect(html).toContain('role="radiogroup"');
    expect(html).toContain('aria-labelledby="housing-situation-legend"');
    expect(html).toContain('id="housing-situation-private-rental"');
    expect(html).toContain('for="housing-situation-private-rental"');
    expect(html).toContain('name="housingSituation"');
    expect(html).toContain('value="private-rental"');
    expect(html).toContain("You rent from a private owner or real estate agent.");
    expect(html).toContain("qld__control-input qld__control-input--block ssq-checkbox__control");
    expect(html).toContain('type="checkbox"');
    expect(html).toContain('id="declaration"');
    expect(html).toContain('for="declaration"');
    expect(html).toContain("I declare the rental support information is ready for review.");
    expect(html).toContain("qld__text-input--error");
    expect(html).toContain('id="weekly-rent"');
    expect(html).toContain('for="weekly-rent"');
    expect(html).toContain('id="weekly-rent-error"');
    expect(html).toContain('aria-describedby="weekly-rent-hint weekly-rent-error"');
    expect(html).toContain("Rental property");
    expect(html).toContain("Enter the weekly rent amount for the property.");
    expect(html).toContain("RSS-2026-0001");
    expect(html).toContain("rss-2026-0001-summary.txt");
    expect(html).not.toContain("F13");
    expect(html).not.toContain("mock draft");
  });

  it("renders the status view with submitted request reference and activity", () => {
    const html = renderToStaticMarkup(
      <RentalSecuritySubsidyStatusContent
        submitResult={submitResult}
        supportingDocuments={workflow.supportingDocuments}
        uploadPolicy={workflow.uploadPolicy}
        workflow={workflow}
      />
    );

    expect(html).toContain("Rental Security Subsidy application status");
    expect(html).toContain("qld__grid");
    expect(html).toContain("vertical-nav");
    expect(html).toContain("qld__left-nav");
    expect(html).toContain("qld__left-nav__content");
    expect(html).toContain("qld__left-nav__item-link");
    expect(html).toContain("qld__left-nav__item-text");
    expect(html).toContain("qld__left-nav__item-icon");
    expect(html).toContain("qld__accordion--open");
    expect(html).toContain('aria-label="Rental Security Subsidy navigation"');
    expect(html).toContain('aria-current="page"');
    expect(html).toContain('href="/#about-service"');
    expect(html).toContain('href="/#eligibility"');
    expect(html).toContain('href="/#before-you-start"');
    expect(html).toContain('href="/application-status#request-summary"');
    expect(html).toContain('href="/application-status#supporting-documents"');
    expect(html).toContain('href="/application-status#recent-activity"');
    expect(html).toContain('id="request-summary"');
    expect(html).toContain('id="supporting-documents"');
    expect(html).toContain('id="supporting-documents-upload"');
    expect(html).toContain('for="supporting-documents-upload"');
    expect(html).toContain('id="recent-activity"');
    expect(html).toContain("container-fluid");
    expect(html).toContain("ssq-layout__container");
    expect(html).toContain("ssq-layout__content--full");
    expect(html).toContain('aria-labelledby="page-title"');
    expect(html).toContain("row");
    expect(html).toContain("ssq-page-header");
    expect(html).toContain("ssq-content-section");
    expect(html).toContain("qld__summary-list");
    expect(html).toContain("qld__page-alerts--success");
    expect(html).toContain("qld__table");
    expect(html).toContain("qld__table__caption");
    expect(html).toContain("Application submitted");
    expect(html).toContain("RSS-2026-0001");
    expect(html).toContain("Download submission summary");
    expect(html).toContain("rental-property-evidence.pdf");
    expect(html).toContain(
      'href="/service-requests/RSS-2026-0001/supporting-documents/mock-rss-rental-evidence/download"'
    );
    expect(html).toContain("household-income-evidence.pdf");
    expect(html).toContain("rental-property-archive.zip");
    expect(html).toContain("Draft saved");
    expect(html).toContain("RSS-2026-0001 submitted");
  });
});
