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
      fileName: "identity-evidence.pdf",
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
    maxFileSizeBytes: 10 * 1024 * 1024,
    rejectedExample: {
      fieldPath: "supportingDocuments[0].file",
      message: "Upload a PDF, JPG or PNG file under 10 MB."
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
  it("renders the overview with apply and status entry points", () => {
    const html = renderToStaticMarkup(<SeniorsCardOverviewContent shell={shell} workflow={workflow} />);

    expect(html).toContain("Seniors Card");
    expect(html).toContain("qld__grid");
    expect(html).toContain("container-fluid");
    expect(html).toContain("row");
    expect(html).toContain("col-xs-12 col-lg-8 col-xl-8");
    expect(html).toContain("col-xs-12 col-lg-4 col-xl-4");
    expect(html).toContain("Frontend-only workflow");
    expect(html).toContain('href="/apply"');
    expect(html).toContain('href="/application-status"');
    expect(html).toContain("seniors-card-draft-001");
  });

  it("renders the apply workflow with mock validation errors and submit result", () => {
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
    expect(html).toContain("container-fluid");
    expect(html).toContain("row");
    expect(html).toContain("col-xs-12 col-lg-4 col-xl-4");
    expect(html).toContain("col-xs-12 col-lg-8 col-xl-8");
    expect(html).toContain("qld__form");
    expect(html).toContain("qld__form-group");
    expect(html).toContain("qld__text-input--error");
    expect(html).toContain('id="date-of-birth"');
    expect(html).toContain('for="date-of-birth"');
    expect(html).toContain('id="date-of-birth-error"');
    expect(html).toContain('aria-describedby="date-of-birth-hint date-of-birth-error"');
    expect(html).toContain("Enter a date of birth that confirms eligibility.");
    expect(html).toContain("SC-2026-0001");
    expect(html).toContain("sc-2026-0001-summary.txt");
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
    expect(html).toContain("container-fluid");
    expect(html).toContain("row");
    expect(html).toContain("col-xs-12 col-lg-6 col-xl-6");
    expect(html).toContain("Application submitted");
    expect(html).toContain("SC-2026-0001");
    expect(html).toContain("Download submission summary");
    expect(html).toContain("identity-evidence.pdf");
    expect(html).toContain("identity-archive.zip");
    expect(html).toContain("Draft saved");
    expect(html).toContain("SC-2026-0001 submitted");
  });
});
