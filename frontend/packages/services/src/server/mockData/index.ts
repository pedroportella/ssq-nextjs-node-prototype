import { createPrototypeAppSummary } from "../../index";

import type {
  PrototypeActivityEntry,
  PrototypeAppKey,
  PrototypeDashboardSummaryData,
  PrototypeDraftSummary,
  PrototypeProfileSummary,
  PrototypeServiceCatalogueEntry,
  PrototypeSupportingDocumentUploadInput,
  PrototypeSupportingDocumentUploadResult,
  PrototypeSubmissionSummaryMetadata,
  PrototypeSubmissionSummaryDownload,
  PrototypeSubmittedRequestSummary,
  PrototypeUploadedDocument,
  PrototypeUploadCategory,
  PrototypeUploadPolicy,
  PrototypeValidationError,
  PrototypeWorkflowData
} from "../../index";
import type { FrontendPublicUrlConfig } from "../publicUrls";

export const mockProfileSummary: PrototypeProfileSummary = {
  displayName: "Avery Taylor",
  email: "avery.taylor@example.test",
  identityStrength: "verified"
};

export function createMockServiceCatalogue(publicUrls: FrontendPublicUrlConfig): PrototypeServiceCatalogueEntry[] {
  return [
    {
      appKey: "seniors-card",
      description: "Check eligibility and prepare a Seniors Card application.",
      href: publicUrls["seniors-card"],
      label: "Seniors Card",
      status: "available"
    },
    {
      appKey: "rental-security-subsidy",
      description: "Prepare rental support information and track a subsidy request.",
      href: publicUrls["rental-security-subsidy"],
      label: "Rental Security Subsidy",
      status: "available"
    }
  ];
}

export function createMockValidationErrors(appKey: Exclude<PrototypeAppKey, "dashboard">): PrototypeValidationError[] {
  if (appKey === "rental-security-subsidy") {
    return [
      {
        fieldPath: "rentalProperty.weeklyRent",
        message: "Enter the weekly rent amount for the property."
      }
    ];
  }

  return [
    {
      fieldPath: "eligibility.dateOfBirth",
      message: "Enter a date of birth that confirms eligibility."
    }
  ];
}

export const mockUploadCategories: PrototypeUploadCategory[] = [
  {
    hint: "Documents that prove the applicant's name or age.",
    label: "Identity evidence",
    value: "identity"
  },
  {
    hint: "Documents that show the applicant lives in Queensland.",
    label: "Residency evidence",
    value: "residency"
  },
  {
    hint: "Pension, concession or card evidence.",
    label: "Concession evidence",
    value: "concession"
  },
  {
    hint: "Payslips, statements or other income evidence.",
    label: "Income evidence",
    value: "income"
  },
  {
    hint: "Service-specific documents requested during assessment.",
    label: "Supporting evidence",
    value: "supporting-evidence"
  },
  {
    label: "Other supporting document",
    value: "supporting-document"
  },
  {
    label: "Other",
    value: "other"
  }
];

export const mockUploadPolicy: PrototypeUploadPolicy = {
  acceptedFileTypes: ["application/pdf", "image/jpeg", "image/png"],
  allowedCategories: mockUploadCategories,
  defaultPersonKey: "applicant",
  maxFileSizeBytes: 5 * 1024 * 1024,
  maxFilesPerPerson: 5,
  maxTotalSizeBytesPerPerson: 10 * 1024 * 1024,
  rejectedExample: {
    fieldPath: "supportingDocuments[0].file",
    message: "Upload a PDF, JPG or PNG file under 5 MB."
  }
};

export function createMockUploadedDocuments(appKey: Exclude<PrototypeAppKey, "dashboard">): PrototypeUploadedDocument[] {
  if (appKey === "rental-security-subsidy") {
    return [
      {
        category: "Rental evidence",
        fileName: "rental-property-evidence.pdf",
        mimeType: "application/pdf",
        personKey: "applicant",
        sizeBytes: 512_000,
        status: "uploaded"
      },
      {
        category: "Income evidence",
        fileName: "household-income-evidence.pdf",
        mimeType: "application/pdf",
        personKey: "household-member",
        sizeBytes: 384_000,
        status: "uploaded"
      },
      {
        category: "Rejected example",
        fileName: "rental-property-archive.zip",
        message: mockUploadPolicy.rejectedExample.message,
        mimeType: "application/zip",
        personKey: "applicant",
        sizeBytes: 14_000_000,
        status: "rejected"
      }
    ];
  }

  return [
    {
      category: "Identity evidence",
      fileName: "identity-evidence.pdf",
      mimeType: "application/pdf",
      personKey: "applicant",
      sizeBytes: 512_000,
      status: "uploaded"
    },
    {
      category: "Rejected example",
      fileName: "identity-archive.zip",
      message: mockUploadPolicy.rejectedExample.message,
      mimeType: "application/zip",
      personKey: "applicant",
      sizeBytes: 14_000_000,
      status: "rejected"
    }
  ];
}

export function createMockSupportingDocumentUploadResult(
  input: PrototypeSupportingDocumentUploadInput
): PrototypeSupportingDocumentUploadResult {
  const category = mockUploadCategories.find((candidate) => candidate.value === input.category);

  return {
    document: {
      category: category?.label ?? input.category,
      fileName: input.fileName,
      mimeType: input.mimeType,
      personKey: input.personKey,
      sizeBytes: input.sizeBytes,
      status: "uploaded"
    },
    fieldErrors: [],
    ok: true,
    policy: mockUploadPolicy
  };
}

export function createMockDraftSummary(appKey: Exclude<PrototypeAppKey, "dashboard">): PrototypeDraftSummary {
  return {
    appKey,
    draftId: `${appKey}-draft-001`,
    lastUpdated: "2026-06-12T01:30:00.000Z",
    status: "DRAFT",
    title: createPrototypeAppSummary(appKey).label
  };
}

export function createMockSubmittedRequestSummary(
  appKey: Exclude<PrototypeAppKey, "dashboard">
): PrototypeSubmittedRequestSummary {
  return {
    appKey,
    referenceNumber: appKey === "seniors-card" ? "SC-2026-0001" : "RSS-2026-0001",
    status: appKey === "seniors-card" ? "APPROVED" : "IN_REVIEW",
    submittedAt: "2026-06-12T02:15:00.000Z",
    supportingDocuments: createMockUploadedDocuments(appKey).filter((document) => document.status === "uploaded"),
    title: createPrototypeAppSummary(appKey).label
  };
}

export function createMockActivity(appKey: Exclude<PrototypeAppKey, "dashboard">): PrototypeActivityEntry[] {
  const submittedRequest = createMockSubmittedRequestSummary(appKey);

  return [
    {
      at: "2026-06-12T01:30:00.000Z",
      description: "Draft saved",
      status: "DRAFT"
    },
    {
      at: submittedRequest.submittedAt,
      description: `${submittedRequest.referenceNumber} submitted`,
      status: submittedRequest.status
    }
  ];
}

export function createMockSubmissionSummaryMetadata(
  appKey: Exclude<PrototypeAppKey, "dashboard">
): PrototypeSubmissionSummaryMetadata {
  const submittedRequest = createMockSubmittedRequestSummary(appKey);

  return {
    filename: `${submittedRequest.referenceNumber.toLowerCase()}-summary.txt`,
    href: `/service-requests/${submittedRequest.referenceNumber}/summary/download`,
    referenceNumber: submittedRequest.referenceNumber
  };
}

export function createMockSubmissionSummaryDownload(
  appKey: Exclude<PrototypeAppKey, "dashboard">,
  referenceNumber = createMockSubmittedRequestSummary(appKey).referenceNumber
): PrototypeSubmissionSummaryDownload {
  const app = createPrototypeAppSummary(appKey);

  return {
    body: [
      `${app.label} prototype submission summary`,
      `Reference: ${referenceNumber}`,
      "This text file is generated by the prototype review runtime."
    ].join("\n"),
    contentType: "text/plain",
    filename: `${referenceNumber.toLowerCase()}-summary.txt`,
    referenceNumber
  };
}

export function createMockDashboardSummaryData(publicUrls: FrontendPublicUrlConfig): PrototypeDashboardSummaryData {
  return {
    activity: [...createMockActivity("seniors-card"), ...createMockActivity("rental-security-subsidy")],
    availableServices: createMockServiceCatalogue(publicUrls),
    drafts: [createMockDraftSummary("seniors-card")],
    profile: mockProfileSummary,
    submittedRequests: [
      createMockSubmittedRequestSummary("seniors-card"),
      createMockSubmittedRequestSummary("rental-security-subsidy")
    ]
  };
}

export function createMockWorkflowData(appKey: Exclude<PrototypeAppKey, "dashboard">): PrototypeWorkflowData {
  return {
    activity: createMockActivity(appKey),
    app: createPrototypeAppSummary(appKey),
    draft: createMockDraftSummary(appKey),
    profile: mockProfileSummary,
    submittedRequest: createMockSubmittedRequestSummary(appKey),
    supportingDocuments: createMockUploadedDocuments(appKey),
    uploadPolicy: mockUploadPolicy,
    validationErrors: createMockValidationErrors(appKey)
  };
}
