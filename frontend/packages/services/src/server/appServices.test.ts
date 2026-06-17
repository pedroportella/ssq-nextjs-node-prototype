import { afterEach, describe, expect, it, vi } from "vitest";

import {
  assignReviewerRequest,
  batchUpdateReviewerRequestStatus,
  createTransactionDraft,
  getDashboardShellData,
  getDashboardSummaryData,
  getReviewerQueueData,
  getReviewerRequestDetailData,
  getSubmissionSummaryDownload,
  getSupportingDocumentDownload,
  getSupportingDocumentUploadPolicy,
  getUploadedDocuments,
  getRentalSecuritySubsidyShellData,
  getRentalSecuritySubsidyWorkflowData,
  getSeniorsCardShellData,
  getSeniorsCardWorkflowData,
  recordSupportingDocumentUploadMetadata,
  submitTransactionDraft,
  updateTransactionDraftWithValidationError
} from "./index";

const backendConfig = {
  backendUrl: "http://backend:7001",
  dataSource: "backend" as const
};

const backendDashboardData = {
  customerProfile: {
    customer: {
      email: "demo.customer@example.test",
      familyName: "Queensland",
      givenName: "Taylor"
    },
    attributes: [
      {
        key: "residency",
        value: {
          state: "QLD",
          verified: true
        }
      }
    ]
  },
  serviceRequestDrafts: [
    {
      id: "70000000-0000-4000-8000-000000000001",
      currentStep: "review",
      payload: {
        dateOfBirth: "1960-01-01"
      },
      transactionKey: "seniors-card",
      updatedAt: "2026-06-12T01:30:00.000Z"
    }
  ],
  serviceRequests: [
    {
      id: "30000000-0000-4000-8000-000000000001",
      payload: {
        submittedVia: "seed"
      },
      referenceNumber: "SSQ-DEMO-0001",
      status: "UNDER_REVIEW",
      transactionKey: "seniors-card",
      createdAt: "2026-06-12T02:15:00.000Z",
      updatedAt: "2026-06-12T02:20:00.000Z"
    }
  ],
  transactionCatalogue: [
    {
      definition: {
        description: "Prototype Seniors Card transaction.",
        key: "seniors-card",
        label: "Seniors Card",
        status: "ENABLED"
      },
      featureEnabled: true
    },
    {
      definition: {
        description: "Prototype Rental Security Subsidy transaction.",
        key: "rental-security-subsidy",
        label: "Rental Security Subsidy",
        status: "ENABLED"
      },
      featureEnabled: true
    }
  ]
};

function mockBackendFetch(
  handler: (input: {
    body?: { query?: string; variables?: Record<string, unknown> };
    init?: RequestInit;
    url: string;
  }) => Response | Promise<Response>
) {
  const fetchImpl = vi.fn<typeof fetch>(async (url, init) => {
    const body = typeof init?.body === "string"
      ? JSON.parse(init.body) as { query?: string; variables?: Record<string, unknown> }
      : undefined;

    return handler({
      body,
      init,
      url: String(url)
    });
  });

  vi.stubGlobal("fetch", fetchImpl);

  return fetchImpl;
}

describe("server app services", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("returns dashboard shell data", async () => {
    await expect(getDashboardShellData()).resolves.toMatchObject({
      app: {
        key: "dashboard",
        status: "UP"
      },
      backendBoundary: "server-only",
      dataSource: "mock",
      session: {
        capabilities: {
          canAccessCitizenServices: true,
          canReviewSubmittedRequests: false
        },
        roles: ["Citizen"],
        source: "MOCK"
      }
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
    mockBackendFetch(({ body, init }) => {
      expect(body?.query).toContain("FrontendPlatform");
      expect((init?.headers as Headers).get("x-ssq-demo-role")).toBe("TeamLead");

      return Response.json({
        data: {
          platform: {
            demoRole: "TeamLead",
            demoSubject: "lead@example.test",
            identityAssuranceLevel: "DEMO_LOW_ASSURANCE",
            identityDisplayName: "TeamLead lead@example.test",
            identitySource: "DEMO_HEADER"
          }
        }
      });
    });
    vi.stubEnv("SSQ_FRONTEND_DEMO_ROLE", "TeamLead");
    vi.stubEnv("SSQ_FRONTEND_DEMO_SUBJECT", "lead@example.test");

    await expect(getDashboardShellData({ backendUrl: "http://backend:7001", dataSource: "backend" })).resolves.toMatchObject({
      app: {
        key: "dashboard"
      },
      dataSource: "backend",
      session: {
        capabilities: {
          canReviewSubmittedRequests: true
        },
        roles: ["TeamLead"],
        source: "DEMO_HEADER",
        subject: "lead@example.test"
      }
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
        }),
        expect.objectContaining({
          referenceNumber: "RSS-2026-0001",
          supportingDocuments: expect.arrayContaining([
            expect.objectContaining({
              fileName: "rental-property-evidence.pdf",
              status: "uploaded"
            }),
            expect.objectContaining({
              fileName: "household-income-evidence.pdf",
              status: "uploaded"
            })
          ])
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

  it("returns mock upload policy, uploaded document states and summary downloads", async () => {
    await expect(getSupportingDocumentUploadPolicy({ dataSource: "mock" })).resolves.toMatchObject({
      acceptedFileTypes: ["application/pdf", "image/jpeg", "image/png"],
      allowedCategories: expect.arrayContaining([
        expect.objectContaining({
          label: "Identity evidence",
          value: "identity"
        })
      ]),
      defaultPersonKey: "applicant",
      maxFilesPerPerson: 5,
      maxTotalSizeBytesPerPerson: 10 * 1024 * 1024,
      rejectedExample: {
        fieldPath: "supportingDocuments[0].file"
      }
    });
    await expect(getUploadedDocuments("rental-security-subsidy", { dataSource: "mock" })).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          fileName: "rental-property-evidence.pdf",
          status: "uploaded"
        }),
        expect.objectContaining({
          fileName: "household-income-evidence.pdf",
          personKey: "household-member",
          status: "uploaded"
        }),
        expect.objectContaining({
          fileName: "rental-property-archive.zip",
          status: "rejected"
        })
      ])
    );
    await expect(getSubmissionSummaryDownload("seniors-card", "SC-2026-0001", { dataSource: "mock" })).resolves.toMatchObject({
      contentType: "text/plain",
      filename: "sc-2026-0001-summary.txt",
      referenceNumber: "SC-2026-0001"
    });
    await expect(getSupportingDocumentDownload(
      "seniors-card",
      "SC-2026-0001",
      "mock-sc-identity-evidence",
      { dataSource: "mock" }
    )).resolves.toMatchObject({
      contentType: "text/plain",
      documentId: "mock-sc-identity-evidence",
      filename: "identity-evidence.pdf.prototype.txt",
      referenceNumber: "SC-2026-0001"
    });
    await expect(recordSupportingDocumentUploadMetadata({
      category: "identity",
      fileName: "identity-evidence.pdf",
      mimeType: "application/pdf",
      personKey: "applicant",
      sizeBytes: 512_000,
      target: {
        draftId: "seniors-card-draft-001",
        type: "DRAFT"
      }
    }, { dataSource: "mock" })).resolves.toMatchObject({
      document: {
        category: "Identity evidence",
        fileName: "identity-evidence.pdf",
        personKey: "applicant",
        status: "uploaded"
      },
      ok: true,
      policy: {
        maxFilesPerPerson: 5
      }
    });
  });

  it("returns mock reviewer queue, detail and mutation results", async () => {
    vi.stubEnv("SSQ_FRONTEND_DEMO_ROLE", "ServiceOfficer");
    vi.stubEnv("SSQ_FRONTEND_DEMO_SUBJECT", "officer@example.test");

    await expect(getReviewerQueueData({ status: "SUBMITTED" }, { dataSource: "mock" })).resolves.toMatchObject({
      canReview: true,
      pageInfo: {
        totalItems: 1
      },
      requests: [
        {
          referenceNumber: "SC-2026-0001",
          status: "SUBMITTED"
        }
      ],
      reviewerRole: "ServiceOfficer",
      statusCounts: expect.arrayContaining([
        {
          count: 1,
          status: "SUBMITTED"
        }
      ])
    });
    await expect(getReviewerRequestDetailData("RSS-2026-0001", { dataSource: "mock" })).resolves.toMatchObject({
      payloadItems: expect.arrayContaining([
        expect.objectContaining({
          label: "Household Income",
          value: "1240"
        })
      ]),
      request: {
        referenceNumber: "RSS-2026-0001",
        status: "IN_REVIEW"
      },
      supportingDocuments: expect.arrayContaining([
        expect.objectContaining({
          fileName: "rental-property-evidence.pdf"
        })
      ])
    });
    await expect(batchUpdateReviewerRequestStatus({
      reason: "Queue triage",
      referenceNumbers: ["SC-2026-0001"],
      status: "IN_REVIEW"
    }, { dataSource: "mock" })).resolves.toMatchObject({
      ok: true,
      results: [
        {
          ok: true,
          referenceNumber: "SC-2026-0001",
          request: {
            status: "IN_REVIEW"
          }
        }
      ]
    });
    await expect(assignReviewerRequest({
      assignedOfficerSubject: "officer@example.test",
      assignedTeam: "Seniors Card",
      reason: "Picked up from queue",
      referenceNumber: "SC-2026-0001"
    }, { dataSource: "mock" })).resolves.toMatchObject({
      ok: true,
      request: {
        assignedOfficerSubject: "officer@example.test",
        assignedTeam: "Seniors Card"
      }
    });
  });

  it("maps backend dashboard summary data", async () => {
    mockBackendFetch(({ body }) => {
      if (body?.query?.includes("FrontendSupportingDocuments")) {
        expect(body.variables).toMatchObject({
          referenceNumber: "SSQ-DEMO-0001"
        });

        return Response.json({
          data: {
            supportingDocuments: []
          }
        });
      }

      expect(body?.query).toContain("FrontendDashboardSummary");

      return Response.json({
        data: backendDashboardData
      });
    });

    await expect(getDashboardSummaryData(backendConfig)).resolves.toMatchObject({
      availableServices: [
        {
          appKey: "seniors-card",
          href: "http://localhost:3001",
          status: "available"
        },
        {
          appKey: "rental-security-subsidy",
          href: "http://localhost:3002",
          status: "available"
        }
      ],
      drafts: [
        {
          draftId: "70000000-0000-4000-8000-000000000001",
          status: "DRAFT"
        }
      ],
      profile: {
        displayName: "Taylor Queensland",
        identityStrength: "verified"
      },
      submittedRequests: [
        {
          referenceNumber: "SSQ-DEMO-0001",
          status: "IN_REVIEW"
        }
      ]
    });
  });

  it("creates backend drafts and maps backend validation errors", async () => {
    const fetchImpl = mockBackendFetch(({ body }) => {
      if (body?.query?.includes("FrontendCreateDraft")) {
        return Response.json({
          data: {
            createServiceRequestDraft: {
              ok: true,
              draft: {
                id: "70000000-0000-4000-8000-000000000010",
                currentStep: "review",
                payload: body.variables?.input,
                transactionKey: "seniors-card",
                updatedAt: "2026-06-12T01:30:00.000Z"
              },
              error: null
            }
          }
        });
      }

      if (body?.query?.includes("FrontendUpdateDraft")) {
        return Response.json({
          data: {
            updateServiceRequestDraft: {
              ok: true,
              draft: {
                id: "70000000-0000-4000-8000-000000000010",
                currentStep: "review",
                payload: body.variables?.input,
                transactionKey: "seniors-card",
                updatedAt: "2026-06-12T01:40:00.000Z"
              },
              error: null
            }
          }
        });
      }

      return Response.json({
        data: {
          submitServiceRequest: {
            ok: false,
            serviceRequest: null,
            error: {
              code: "VALIDATION_FAILED",
              message: "Draft payload failed validation."
            },
            fieldErrors: [
              {
                field: "dateOfBirth",
                message: "Must be a valid date in YYYY-MM-DD format."
              }
            ]
          }
        }
      });
    });

    await expect(createTransactionDraft("seniors-card", backendConfig)).resolves.toMatchObject({
      draft: {
        draftId: "70000000-0000-4000-8000-000000000010",
        status: "DRAFT"
      },
      validationErrors: []
    });
    await expect(updateTransactionDraftWithValidationError("seniors-card", backendConfig)).resolves.toMatchObject({
      validationErrors: [
        {
          fieldPath: "eligibility.dateOfBirth",
          message: "Must be a valid date in YYYY-MM-DD format."
        }
      ]
    });
    expect(fetchImpl).toHaveBeenCalledTimes(4);
  });

  it("submits backend drafts and reads generated summary metadata", async () => {
    mockBackendFetch(({ body }) => {
      if (body?.query?.includes("FrontendCreateDraft")) {
        return Response.json({
          data: {
            createServiceRequestDraft: {
              ok: true,
              draft: {
                id: "70000000-0000-4000-8000-000000000020",
                currentStep: "review",
                payload: {},
                transactionKey: "rental-security-subsidy",
                updatedAt: "2026-06-12T01:30:00.000Z"
              },
              error: null
            }
          }
        });
      }

      if (body?.query?.includes("FrontendSubmitDraft")) {
        return Response.json({
          data: {
            submitServiceRequest: {
              ok: true,
              serviceRequest: {
                id: "30000000-0000-4000-8000-000000000020",
                payload: {},
                referenceNumber: "SSQ-TEST-0002",
                status: "SUBMITTED",
                transactionKey: "rental-security-subsidy",
                createdAt: "2026-06-12T02:15:00.000Z",
                updatedAt: "2026-06-12T02:15:00.000Z"
              },
              error: null,
              fieldErrors: []
            }
          }
        });
      }

      return Response.json({
        data: {
          submissionSummary: {
            contentType: "text/plain; charset=utf-8",
            fileName: "SSQ-TEST-0002-summary.txt"
          }
        }
      });
    });

    await expect(submitTransactionDraft("rental-security-subsidy", backendConfig)).resolves.toMatchObject({
      referenceNumber: "SSQ-TEST-0002",
      status: "SUBMITTED",
      summary: {
        filename: "SSQ-TEST-0002-summary.txt",
        href: "/service-requests/SSQ-TEST-0002/summary/download"
      }
    });
  });

  it("reads backend upload policy, uploaded documents and summary downloads", async () => {
    mockBackendFetch(({ body, url }) => {
      if (url.endsWith("/service-requests/SSQ-TEST-0002/supporting-documents/doc-income/download")) {
        return new Response("Document: doc-income", {
          headers: {
            "content-disposition": 'attachment; filename="income-evidence.pdf.prototype.txt"',
            "content-type": "text/plain; charset=utf-8"
          }
        });
      }

      if (url.endsWith("/service-requests/SSQ-TEST-0002/summary/download")) {
        return new Response("Reference: SSQ-TEST-0002", {
          headers: {
            "content-disposition": 'attachment; filename="SSQ-TEST-0002-summary.txt"',
            "content-type": "text/plain; charset=utf-8"
          }
        });
      }

      if (body?.query?.includes("FrontendDashboardSummary")) {
        return Response.json({
          data: {
            ...backendDashboardData,
            serviceRequests: [
              {
                ...backendDashboardData.serviceRequests[0],
                referenceNumber: "SSQ-TEST-0002",
                transactionKey: "rental-security-subsidy"
              }
            ]
          }
        });
      }

      return Response.json({
        data: {
          supportingDocuments: [
            {
              category: "income",
              fileName: "income-evidence.pdf",
              id: "doc-income",
              mimeType: "application/pdf",
              scanStatus: "PASSED",
              sizeBytes: 512000,
              uploadStatus: "UPLOADED"
            },
            {
              category: "identity",
              fileName: "identity-quarantine.pdf",
              id: "doc-quarantine",
              mimeType: "application/pdf",
              scanStatus: "QUARANTINED",
              sizeBytes: 512000,
              uploadStatus: "STORED_PROTOTYPE"
            }
          ]
        }
      });
    });

    await expect(getSupportingDocumentUploadPolicy(backendConfig)).resolves.toMatchObject({
      allowedCategories: expect.arrayContaining([
        expect.objectContaining({
          value: "identity"
        })
      ]),
      maxFileSizeBytes: 5 * 1024 * 1024,
      maxFilesPerPerson: 5,
      maxTotalSizeBytesPerPerson: 10 * 1024 * 1024
    });
    await expect(getUploadedDocuments("rental-security-subsidy", backendConfig)).resolves.toEqual([
      expect.objectContaining({
        category: "Income",
        downloadHref: "/service-requests/SSQ-TEST-0002/supporting-documents/doc-income/download",
        fileName: "income-evidence.pdf",
        id: "doc-income",
        status: "uploaded"
      }),
      expect.objectContaining({
        category: "Identity",
        downloadHref: undefined,
        fileName: "identity-quarantine.pdf",
        status: "rejected"
      })
    ]);
    await expect(getSubmissionSummaryDownload("rental-security-subsidy", "SSQ-TEST-0002", backendConfig)).resolves.toEqual({
      body: "Reference: SSQ-TEST-0002",
      contentType: "text/plain",
      filename: "SSQ-TEST-0002-summary.txt",
      referenceNumber: "SSQ-TEST-0002"
    });
    await expect(getSupportingDocumentDownload(
      "rental-security-subsidy",
      "SSQ-TEST-0002",
      "doc-income",
      backendConfig
    )).resolves.toEqual({
      body: "Document: doc-income",
      contentType: "text/plain",
      documentId: "doc-income",
      filename: "income-evidence.pdf.prototype.txt",
      referenceNumber: "SSQ-TEST-0002"
    });
  });

  it("maps backend reviewer queue, detail and actions through staff GraphQL headers", async () => {
    mockBackendFetch(({ body, init }) => {
      expect(init?.headers).toBeInstanceOf(Headers);
      expect((init?.headers as Headers).get("x-ssq-demo-role")).toBe("ServiceOfficer");

      if (body?.query?.includes("FrontendReviewerQueue")) {
        expect(body.variables?.input).toMatchObject({
          status: "UNDER_REVIEW"
        });

        return Response.json({
          data: {
            platform: {
              demoRole: "ServiceOfficer",
              demoSubject: "officer@example.test",
              identityDisplayName: "ServiceOfficer officer@example.test"
            },
            submittedServiceRequestConnection: {
              ok: true,
              error: null,
              connection: {
                items: [
                  {
                    assignedOfficerSubject: "officer@example.test",
                    assignedTeam: "Rental support",
                    createdAt: "2026-06-12T03:00:00.000Z",
                    id: "30000000-0000-4000-8000-000000000002",
                    lastTouchedAt: "2026-06-12T03:10:00.000Z",
                    lastTouchedBy: "officer@example.test",
                    payload: {
                      householdIncome: 1240
                    },
                    referenceNumber: "SSQ-TEST-0002",
                    status: "UNDER_REVIEW",
                    transactionKey: "rental-security-subsidy",
                    updatedAt: "2026-06-12T03:10:00.000Z"
                  }
                ],
                pageInfo: {
                  page: 1,
                  pageSize: 20,
                  totalItems: 1,
                  totalPages: 1
                },
                statusCounts: [
                  {
                    count: 1,
                    status: "UNDER_REVIEW"
                  }
                ]
              }
            }
          }
        });
      }

      if (body?.query?.includes("FrontendReviewerRequest")) {
        return Response.json({
          data: {
            platform: {
              demoRole: "TeamLead",
              demoSubject: "lead@example.test",
              identityDisplayName: "TeamLead lead@example.test"
            },
            serviceRequest: {
              assignedOfficerSubject: "officer@example.test",
              assignedTeam: "Rental support",
              createdAt: "2026-06-12T03:00:00.000Z",
              id: "30000000-0000-4000-8000-000000000002",
              lastTouchedAt: "2026-06-12T03:10:00.000Z",
              lastTouchedBy: "officer@example.test",
              payload: {
                householdIncome: 1240
              },
              referenceNumber: "SSQ-TEST-0002",
              status: "UNDER_REVIEW",
              transactionKey: "rental-security-subsidy",
              updatedAt: "2026-06-12T03:10:00.000Z"
            },
            supportingDocuments: [
              {
                category: "income",
                fileName: "income-evidence.pdf",
                id: "doc-income",
                mimeType: "application/pdf",
                scanStatus: "PASSED",
                sizeBytes: 512000,
                uploadStatus: "STORED_PROTOTYPE"
              }
            ]
          }
        });
      }

      if (body?.query?.includes("FrontendReviewerActivity")) {
        return Response.json({
          data: {
            activityLogs: [
              {
                createdAt: "2026-06-12T03:10:00.000Z",
                eventPayload: {
                  referenceNumber: "SSQ-TEST-0002"
                },
                eventType: "SERVICE_REQUEST_STATUS_CHANGED"
              }
            ]
          }
        });
      }

      if (body?.query?.includes("FrontendReviewerBatchStatus")) {
        expect(body.variables?.input).toMatchObject({
          referenceNumbers: ["SSQ-TEST-0002"],
          status: "UNDER_REVIEW"
        });

        return Response.json({
          data: {
            batchUpdateServiceRequestStatus: {
              ok: true,
              error: null,
              results: [
                {
                  ok: true,
                  referenceNumber: "SSQ-TEST-0002",
                  error: null,
                  serviceRequest: {
                    assignedOfficerSubject: "officer@example.test",
                    assignedTeam: "Rental support",
                    createdAt: "2026-06-12T03:00:00.000Z",
                    id: "30000000-0000-4000-8000-000000000002",
                    lastTouchedAt: "2026-06-12T03:10:00.000Z",
                    lastTouchedBy: "officer@example.test",
                    payload: {},
                    referenceNumber: "SSQ-TEST-0002",
                    status: "UNDER_REVIEW",
                    transactionKey: "rental-security-subsidy",
                    updatedAt: "2026-06-12T03:10:00.000Z"
                  }
                }
              ]
            }
          }
        });
      }

      return Response.json({
        data: {
          assignServiceRequest: {
            ok: true,
            error: null,
            serviceRequest: {
              assignedOfficerSubject: "lead@example.test",
              assignedTeam: "Rental support",
              createdAt: "2026-06-12T03:00:00.000Z",
              id: "30000000-0000-4000-8000-000000000002",
              lastTouchedAt: "2026-06-12T03:10:00.000Z",
              lastTouchedBy: "lead@example.test",
              payload: {},
              referenceNumber: "SSQ-TEST-0002",
              status: "UNDER_REVIEW",
              transactionKey: "rental-security-subsidy",
              updatedAt: "2026-06-12T03:10:00.000Z"
            }
          }
        }
      });
    });

    await expect(getReviewerQueueData({ status: "IN_REVIEW" }, backendConfig)).resolves.toMatchObject({
      canReview: true,
      requests: [
        {
          referenceNumber: "SSQ-TEST-0002",
          status: "IN_REVIEW"
        }
      ],
      statusCounts: [
        {
          count: 1,
          status: "IN_REVIEW"
        }
      ]
    });
    await expect(getReviewerRequestDetailData("SSQ-TEST-0002", backendConfig)).resolves.toMatchObject({
      activity: [
        {
          description: "Status changed for SSQ-TEST-0002"
        }
      ],
      payloadItems: [
        {
          label: "Household Income",
          value: "1240"
        }
      ],
      supportingDocuments: [
        {
          downloadHref: "/service-requests/SSQ-TEST-0002/supporting-documents/doc-income/download",
          fileName: "income-evidence.pdf"
        }
      ]
    });
    await expect(batchUpdateReviewerRequestStatus({
      reason: "Queue triage",
      referenceNumbers: ["SSQ-TEST-0002"],
      status: "IN_REVIEW"
    }, backendConfig)).resolves.toMatchObject({
      ok: true,
      results: [
        {
          referenceNumber: "SSQ-TEST-0002",
          request: {
            status: "IN_REVIEW"
          }
        }
      ]
    });
    await expect(assignReviewerRequest({
      assignedOfficerSubject: "lead@example.test",
      assignedTeam: "Rental support",
      reason: "Escalated",
      referenceNumber: "SSQ-TEST-0002"
    }, backendConfig)).resolves.toMatchObject({
      ok: true,
      request: {
        assignedOfficerSubject: "lead@example.test"
      }
    });
  });

  it("records backend supporting document metadata through the server-only REST adapter", async () => {
    mockBackendFetch(({ body, url }) => {
      expect(url).toBe("http://backend:7001/uploads/supporting-documents");
      expect(body).toMatchObject({
        category: "identity",
        fileName: "identity-evidence.pdf",
        personKey: "applicant",
        target: {
          draftId: "70000000-0000-4000-8000-000000000001",
          type: "DRAFT"
        }
      });

      return Response.json({
        correlationId: "upload-correlation",
        document: {
          category: "identity",
          fileName: "identity-evidence.pdf",
          id: "doc-uploaded",
          metadata: {
            personKey: "applicant"
          },
          mimeType: "application/pdf",
          scanStatus: "AVAILABLE",
          sizeBytes: 512000,
          uploadStatus: "STORED_PROTOTYPE"
        },
        ok: true,
        policy: {
          allowedCategories: ["identity", "residency", "supporting-evidence"],
          allowedMimeTypes: ["application/pdf", "image/jpeg", "image/png"],
          defaultPersonKey: "applicant",
          maxFilesPerPerson: 5,
          maxSizeBytes: 5 * 1024 * 1024,
          maxTotalSizeBytesPerPerson: 10 * 1024 * 1024
        }
      });
    });

    await expect(recordSupportingDocumentUploadMetadata({
      category: "identity",
      fileName: "identity-evidence.pdf",
      mimeType: "application/pdf",
      personKey: "applicant",
      sizeBytes: 512_000,
      target: {
        draftId: "70000000-0000-4000-8000-000000000001",
        type: "DRAFT"
      }
    }, backendConfig)).resolves.toMatchObject({
      document: {
        category: "Identity",
        fileName: "identity-evidence.pdf",
        mimeType: "application/pdf",
        personKey: "applicant",
        status: "uploaded"
      },
      ok: true,
      policy: {
        allowedCategories: [
          expect.objectContaining({
            value: "identity"
          }),
          expect.objectContaining({
            value: "residency"
          }),
          expect.objectContaining({
            value: "supporting-evidence"
          })
        ],
        maxFilesPerPerson: 5,
        maxTotalSizeBytesPerPerson: 10 * 1024 * 1024
      }
    });
  });
});
