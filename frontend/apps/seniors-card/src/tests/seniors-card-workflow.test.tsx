import { createPrototypeAppSummary } from "@ssq/services";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { SeniorsCardApplyContent } from "../containers/SeniorsCardApplyContainer";
import { SeniorsCardOverviewContent } from "../containers/SeniorsCardOverviewContainer";
import { SeniorsCardStatusContent } from "../containers/SeniorsCardStatusContainer";

import type {
  PrototypeDraftMutationResult,
  PrototypeSubmitResult,
  PrototypeWorkflowData
} from "@ssq/services";
import type { AppShellData } from "@ssq/services/server";

const shell: AppShellData = {
  app: createPrototypeAppSummary("seniors-card"),
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
      description: "SC-2026-0001 submitted",
      status: "APPROVED"
    }
  ],
  app: createPrototypeAppSummary("seniors-card"),
  draft: {
    appKey: "seniors-card",
    draftId: "seniors-card-draft-001",
    lastUpdated: "2026-06-12T01:30:00.000Z",
    status: "DRAFT",
    title: "Seniors Card"
  },
  profile: {
    displayName: "Avery Taylor",
    email: "avery.taylor@example.test",
    identityStrength: "verified"
  },
  submittedRequest: {
    appKey: "seniors-card",
    referenceNumber: "SC-2026-0001",
    status: "APPROVED",
    submittedAt: "2026-06-12T02:15:00.000Z",
    title: "Seniors Card"
  },
  supportingDocuments: [
    {
      category: "Identity evidence",
      downloadHref: "/service-requests/SC-2026-0001/supporting-documents/mock-sc-identity-evidence/download",
      fileName: "identity-evidence.pdf",
      id: "mock-sc-identity-evidence",
      sizeBytes: 512_000,
      status: "uploaded"
    },
    {
      category: "Rejected example",
      fileName: "identity-archive.zip",
      message: "Upload a PDF, JPG or PNG file under 10 MB.",
      sizeBytes: 14_000_000,
      status: "rejected"
    }
  ],
  uploadPolicy: {
    acceptedFileTypes: ["application/pdf", "image/jpeg", "image/png"],
    allowedCategories: [
      { hint: "Documents that prove the applicant's name or age.", label: "Identity evidence", value: "identity" },
      { hint: "Documents that show the applicant lives in Queensland.", label: "Residency evidence", value: "residency" },
      { hint: "Pension, concession or card evidence.", label: "Concession evidence", value: "concession" },
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
      fieldPath: "eligibility.dateOfBirth",
      message: "Enter a date of birth that confirms eligibility."
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
  referenceNumber: "SC-2026-0001",
  status: "APPROVED",
  summary: {
    filename: "sc-2026-0001-summary.txt",
    href: "/service-requests/SC-2026-0001/summary/download",
    referenceNumber: "SC-2026-0001"
  }
};

describe("Seniors Card workflow containers", () => {
  it("renders the landing page with side navigation and application entry points", () => {
    const html = renderToStaticMarkup(<SeniorsCardOverviewContent shell={shell} workflow={workflow} />);

    expect(html).toContain("Seniors Card");
    expect(html).toContain("qld__grid");
    expect(html).toContain("vertical-nav");
    expect(html).toContain("qld__left-nav");
    expect(html).toContain("qld__left-nav__content");
    expect(html).toContain("qld__left-nav__item-link");
    expect(html).toContain("qld__left-nav__item-text");
    expect(html).toContain("qld__left-nav__item-icon");
    expect(html).toContain('aria-label="Seniors Card navigation"');
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
    expect(html).toContain("Prototype workflow");
    expect(html).toContain("About this service");
    expect(html).toContain("Before you start");
    expect(html).toContain("The next step opens the multistep form without the landing page side navigation.");
    expect(html).toContain("seniors-card-draft-001");
  });

  it("renders the apply workflow with validation errors and submit result", () => {
    const html = renderToStaticMarkup(
      <SeniorsCardApplyContent
        createdDraft={createdDraft}
        submitResult={submitResult}
        validationResult={validationResult}
        workflow={workflow}
      />
    );

    expect(html).toContain("Check your eligibility");
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
    expect(html).toContain("Eligibility details");
    expect(html).toContain("qld__direction-link");
    expect(html).toContain("Back to Seniors Card landing page");
    expect(html).toContain("Back to landing page");
    expect(html).toContain("qld__progress-indicator");
    expect(html).toContain("qld__progress-indicator__item--current");
    expect(html).toContain("Supporting evidence");
    expect(html).toContain("ssq-categorized-upload");
    expect(html).toContain('id="supporting-evidence-applicant-upload"');
    expect(html).toContain('name="supportingEvidence[applicant][]"');
    expect(html).toContain('accept="application/pdf,image/jpeg,image/png"');
    expect(html).toContain("Maximum 5 files and 10.0 MB total per person.");
    expect(html).toContain("qld__form-group");
    expect(html).toContain("qld__select");
    expect(html).toContain("qld__select-control");
    expect(html).toContain('id="residential-state"');
    expect(html).toContain('<option value="qld" selected="">Queensland</option>');
    expect(html).toContain("qld__radio-buttons");
    expect(html).toContain('role="radiogroup"');
    expect(html).toContain('aria-labelledby="age-eligible-legend"');
    expect(html).toContain('id="age-eligible-yes"');
    expect(html).toContain('for="age-eligible-yes"');
    expect(html).toContain('name="ageEligible"');
    expect(html).toContain('value="yes"');
    expect(html).toContain("Are you 65 years or older?");
    expect(html).toContain("qld__control-input qld__control-input--block ssq-checkbox__control");
    expect(html).toContain('type="checkbox"');
    expect(html).toContain('id="declaration"');
    expect(html).toContain('for="declaration"');
    expect(html).toContain("I declare this prototype information is ready for review.");
    expect(html).toContain("qld__text-input--error");
    expect(html).toContain('id="date-of-birth"');
    expect(html).toContain('for="date-of-birth"');
    expect(html).toContain('id="date-of-birth-error"');
    expect(html).toContain('aria-describedby="date-of-birth-hint date-of-birth-error"');
    expect(html).toContain("Enter a date of birth that confirms eligibility.");
    expect(html).toContain("SC-2026-0001");
    expect(html).toContain("sc-2026-0001-summary.txt");
    expect(html).not.toContain("F13");
    expect(html).not.toContain("mock services");
  });

  it("renders the status view with submitted request reference and activity", () => {
    const html = renderToStaticMarkup(
      <SeniorsCardStatusContent
        submitResult={submitResult}
        supportingDocuments={workflow.supportingDocuments}
        uploadPolicy={workflow.uploadPolicy}
        workflow={workflow}
      />
    );

    expect(html).toContain("Seniors Card application status");
    expect(html).toContain("qld__grid");
    expect(html).toContain("vertical-nav");
    expect(html).toContain("qld__left-nav");
    expect(html).toContain("qld__left-nav__content");
    expect(html).toContain("qld__left-nav__item-link");
    expect(html).toContain("qld__left-nav__item-text");
    expect(html).toContain("qld__left-nav__item-icon");
    expect(html).toContain("qld__accordion--open");
    expect(html).toContain('aria-label="Seniors Card navigation"');
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
    expect(html).toContain("SC-2026-0001");
    expect(html).toContain("Download submission summary");
    expect(html).toContain("identity-evidence.pdf");
    expect(html).toContain('href="/service-requests/SC-2026-0001/supporting-documents/mock-sc-identity-evidence/download"');
    expect(html).toContain("identity-archive.zip");
    expect(html).toContain("Draft saved");
    expect(html).toContain("SC-2026-0001 submitted");
  });
});
