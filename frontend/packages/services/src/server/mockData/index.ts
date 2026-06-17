import { createPrototypeAppSummary } from "../../index";

import type {
  PrototypeActivityEntry,
  PrototypeAppKey,
  PrototypeDashboardSummaryData,
  PrototypeDraftSummary,
  PrototypeProfileSummary,
  PrototypeReviewerActivityEntry,
  PrototypeReviewerAssignInput,
  PrototypeReviewerAssignResult,
  PrototypeReviewerBatchStatusInput,
  PrototypeReviewerBatchStatusResult,
  PrototypeReviewerPayloadItem,
  PrototypeReviewerQueueData,
  PrototypeReviewerQueueFilters,
  PrototypeReviewerRequestDetailData,
  PrototypeReviewerRequestSummary,
  PrototypeReviewerStatus,
  PrototypeServiceCatalogueEntry,
  PrototypeSupportingDocumentDownload,
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

function getMockReferenceNumber(appKey: Exclude<PrototypeAppKey, "dashboard">): string {
  return appKey === "seniors-card" ? "SC-2026-0001" : "RSS-2026-0001";
}

function createSupportingDocumentDownloadHref(referenceNumber: string, documentId: string): string {
  return `/service-requests/${referenceNumber}/supporting-documents/${documentId}/download`;
}

export function createMockUploadedDocuments(appKey: Exclude<PrototypeAppKey, "dashboard">): PrototypeUploadedDocument[] {
  const referenceNumber = getMockReferenceNumber(appKey);

  if (appKey === "rental-security-subsidy") {
    return [
      {
        category: "Rental evidence",
        downloadHref: createSupportingDocumentDownloadHref(referenceNumber, "mock-rss-rental-evidence"),
        fileName: "rental-property-evidence.pdf",
        id: "mock-rss-rental-evidence",
        mimeType: "application/pdf",
        personKey: "applicant",
        sizeBytes: 512_000,
        status: "uploaded"
      },
      {
        category: "Income evidence",
        downloadHref: createSupportingDocumentDownloadHref(referenceNumber, "mock-rss-income-evidence"),
        fileName: "household-income-evidence.pdf",
        id: "mock-rss-income-evidence",
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
      downloadHref: createSupportingDocumentDownloadHref(referenceNumber, "mock-sc-identity-evidence"),
      fileName: "identity-evidence.pdf",
      id: "mock-sc-identity-evidence",
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

const mockReviewerRequests: Array<PrototypeReviewerRequestSummary & { payload: Record<string, unknown> }> = [
  {
    appKey: "seniors-card",
    assignedTeam: "Seniors Card",
    id: "30000000-0000-4000-8000-000000000001",
    lastTouchedAt: "2026-06-12T02:20:00.000Z",
    lastTouchedBy: "seed",
    payload: {
      concessionConsent: true,
      dateOfBirth: "1960-01-01",
      residencyStatus: "queensland-resident"
    },
    referenceNumber: "SC-2026-0001",
    status: "SUBMITTED",
    submittedAt: "2026-06-12T02:15:00.000Z",
    title: "Seniors Card"
  },
  {
    appKey: "rental-security-subsidy",
    assignedOfficerSubject: "officer@example.test",
    assignedTeam: "Rental support",
    id: "30000000-0000-4000-8000-000000000002",
    lastTouchedAt: "2026-06-12T03:10:00.000Z",
    lastTouchedBy: "officer@example.test",
    payload: {
      householdIncome: 1240,
      rentalBondAmount: 2480,
      supportingDocuments: ["rental-property-evidence.pdf"]
    },
    referenceNumber: "RSS-2026-0001",
    status: "IN_REVIEW",
    submittedAt: "2026-06-12T03:00:00.000Z",
    title: "Rental Security Subsidy"
  },
  {
    appKey: "seniors-card",
    assignedTeam: "Seniors Card",
    id: "30000000-0000-4000-8000-000000000003",
    lastTouchedAt: "2026-06-13T01:10:00.000Z",
    lastTouchedBy: "lead@example.test",
    payload: {
      concessionConsent: false,
      dateOfBirth: "1958-08-11",
      residencyStatus: "needs-follow-up"
    },
    referenceNumber: "SC-2026-0002",
    status: "ACTION_REQUIRED",
    submittedAt: "2026-06-13T01:00:00.000Z",
    title: "Seniors Card"
  }
];

function filterMockReviewerRequests(filters: PrototypeReviewerQueueFilters) {
  const search = filters.search?.trim().toLowerCase();

  return mockReviewerRequests.filter((request) => {
    const matchesStatus = filters.status ? request.status === filters.status : true;
    const matchesSearch = search
      ? [
          request.referenceNumber,
          request.title,
          request.assignedOfficerSubject,
          request.assignedTeam,
          request.status
        ].some((value) => value?.toLowerCase().includes(search))
      : true;

    return matchesStatus && matchesSearch;
  });
}

function createMockReviewerStatusCounts(requests = mockReviewerRequests): PrototypeReviewerQueueData["statusCounts"] {
  const counts = new Map<PrototypeReviewerStatus, number>();

  for (const request of requests) {
    counts.set(request.status, (counts.get(request.status) ?? 0) + 1);
  }

  return Array.from(counts.entries()).map(([status, count]) => ({ count, status }));
}

export function createMockReviewerQueueData(filters: PrototypeReviewerQueueFilters = {}): PrototypeReviewerQueueData {
  const filteredRequests = filterMockReviewerRequests(filters);

  return {
    canReview: true,
    filters,
    pageInfo: {
      page: 1,
      pageSize: 20,
      totalItems: filteredRequests.length,
      totalPages: filteredRequests.length > 0 ? 1 : 0
    },
    requests: filteredRequests.map(({ payload: _payload, ...request }) => request),
    reviewerRole: "ServiceOfficer",
    reviewerSubject: "officer@example.test",
    statusCounts: createMockReviewerStatusCounts()
  };
}

function createPayloadItems(payload: Record<string, unknown>): PrototypeReviewerPayloadItem[] {
  return Object.entries(payload).map(([key, value]) => ({
    label: key
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (character) => character.toUpperCase()),
    value: Array.isArray(value) ? value.join(", ") : String(value)
  }));
}

function createMockReviewerActivity(request: PrototypeReviewerRequestSummary): PrototypeReviewerActivityEntry[] {
  return [
    {
      at: request.submittedAt,
      description: `${request.referenceNumber} submitted`
    },
    ...(request.lastTouchedAt && request.lastTouchedBy
      ? [
          {
            at: request.lastTouchedAt,
            description: `Last touched by ${request.lastTouchedBy}`
          }
        ]
      : [])
  ];
}

export function createMockReviewerRequestDetailData(referenceNumber: string): PrototypeReviewerRequestDetailData {
  const request = mockReviewerRequests.find((candidate) => candidate.referenceNumber === referenceNumber);

  if (!request) {
    return {
      activity: [],
      canReview: true,
      payloadItems: [],
      reviewerRole: "ServiceOfficer",
      reviewerSubject: "officer@example.test",
      supportingDocuments: []
    };
  }

  const { payload, ...summary } = request;

  return {
    activity: createMockReviewerActivity(summary),
    canReview: true,
    payloadItems: createPayloadItems(payload),
    request: summary,
    reviewerRole: "ServiceOfficer",
    reviewerSubject: "officer@example.test",
    supportingDocuments: createMockUploadedDocuments(summary.appKey).filter((document) => document.status === "uploaded")
  };
}

export function createMockReviewerBatchStatusResult(
  input: PrototypeReviewerBatchStatusInput
): PrototypeReviewerBatchStatusResult {
  const references = input.referenceNumbers.map((referenceNumber) => referenceNumber.trim()).filter(Boolean);

  if (references.length === 0) {
    return {
      error: {
        code: "INVALID_REFERENCE_NUMBERS",
        message: "Select at least one request."
      },
      ok: false,
      results: []
    };
  }

  const results = references.map((referenceNumber) => {
    const request = mockReviewerRequests.find((candidate) => candidate.referenceNumber === referenceNumber);

    return request
      ? {
          ok: true,
          referenceNumber,
          request: {
            ...request,
            status: input.status
          }
        }
      : {
          error: {
            code: "SERVICE_REQUEST_NOT_FOUND",
            message: "Service request was not found."
          },
          ok: false,
          referenceNumber
        };
  });

  return {
    error: results.every((result) => result.ok)
      ? undefined
      : {
          code: "PARTIAL_FAILURE",
          message: "One or more service request status updates failed."
        },
    ok: results.every((result) => result.ok),
    results
  };
}

export function createMockReviewerAssignResult(input: PrototypeReviewerAssignInput): PrototypeReviewerAssignResult {
  const request = mockReviewerRequests.find((candidate) => candidate.referenceNumber === input.referenceNumber);

  if (!request) {
    return {
      error: {
        code: "SERVICE_REQUEST_NOT_FOUND",
        message: "Service request was not found."
      },
      ok: false
    };
  }

  return {
    ok: true,
    request: {
      ...request,
      assignedOfficerSubject: input.assignedOfficerSubject,
      assignedTeam: input.assignedTeam,
      lastTouchedAt: "2026-06-17T00:00:00.000Z",
      lastTouchedBy: "officer@example.test"
    }
  };
}

export function createMockSupportingDocumentUploadResult(
  input: PrototypeSupportingDocumentUploadInput
): PrototypeSupportingDocumentUploadResult {
  const category = mockUploadCategories.find((candidate) => candidate.value === input.category);
  const documentId = `mock-upload-${input.fileName.replace(/[^a-zA-Z0-9._-]/g, "-")}`;

  return {
    document: {
      category: category?.label ?? input.category,
      downloadHref: input.target.type === "SERVICE_REQUEST"
        ? createSupportingDocumentDownloadHref(input.target.referenceNumber, documentId)
        : undefined,
      fileName: input.fileName,
      id: documentId,
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
    referenceNumber: getMockReferenceNumber(appKey),
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

export function createMockSupportingDocumentDownload(
  appKey: Exclude<PrototypeAppKey, "dashboard">,
  referenceNumber: string,
  documentId: string
): PrototypeSupportingDocumentDownload {
  const document = createMockUploadedDocuments(appKey).find((candidate) => candidate.id === documentId);

  if (!document || document.status !== "uploaded") {
    throw new Error("Mock supporting document is not available for download.");
  }

  return {
    body: [
      "SSQ prototype supporting document artifact",
      `Document ID: ${documentId}`,
      `Reference: ${referenceNumber}`,
      `Original filename: ${document.fileName}`,
      `Category: ${document.category}`,
      "",
      "This text file is generated by the frontend mock runtime."
    ].join("\n"),
    contentType: "text/plain",
    documentId,
    filename: `${document.fileName}.prototype.txt`,
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
