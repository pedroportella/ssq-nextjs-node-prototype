import { describe, expect, it } from "vitest";

import { buildApp } from "../app.js";
import { loadConfig } from "../config.js";

import type { DatabaseClient } from "../database/client.js";
import type { QueryResult, QueryResultRow } from "pg";

function createUploadTestDatabase(options: {
  recordedEvents?: QueryResultRow[];
  seedSupportingDocuments?: QueryResultRow[];
  transactionKey?: string;
} = {}): DatabaseClient {
  const supportingDocuments: QueryResultRow[] = [...(options.seedSupportingDocuments ?? [])];
  const recordedEvents = options.recordedEvents ?? [];
  const transactionKey = options.transactionKey ?? "seniors-card";

  return {
    queryable: {
      async query<T extends QueryResultRow = QueryResultRow>(sql: string, values: readonly unknown[] = []): Promise<QueryResult<T>> {
        const normalizedSql = sql.replace(/\s+/g, " ").trim();

        if (normalizedSql.includes("FROM customers")) {
          if (values[0] === "missing@example.test") {
            return result<T>([]);
          }

          return result<T>([
            {
              id: values[0] === "other.customer@example.test"
                ? "10000000-0000-4000-8000-000000000999"
                : "10000000-0000-4000-8000-000000000001",
              external_ref: "MYQLD-DEMO-001",
              email: String(values[0]),
              given_name: "Taylor",
              family_name: "Queensland"
            } as unknown as T
          ]);
        }

        if (normalizedSql.includes("FROM service_request_drafts srd")) {
          if (values[1] === "10000000-0000-4000-8000-000000000999") {
            return result<T>([]);
          }

          return result<T>([
            {
              id: values[0],
              customer_id: values[1],
              transaction_definition_id: "20000000-0000-4000-8000-000000000002",
              transaction_key: transactionKey,
              current_step: "documents",
              payload: {},
              created_at: "2026-06-10T00:00:00.000Z",
              updated_at: "2026-06-10T00:00:00.000Z"
            } as unknown as T
          ]);
        }

        if (normalizedSql.includes("FROM supporting_documents sd") && normalizedSql.includes("INNER JOIN service_requests sr")) {
          const documentId = String(values[0]);
          const referenceNumber = String(values[1]);
          const customerId = values[2] ? String(values[2]) : undefined;

          return result<T>(supportingDocuments.filter(
            (document) =>
              document.id === documentId &&
              document.service_request_id &&
              (document.reference_number ?? "SSQ-DEMO-0001") === referenceNumber &&
              (document.service_request_status ?? "SUBMITTED") !== "DRAFT" &&
              (!customerId || document.customer_id === customerId)
          ) as T[]);
        }

        if (normalizedSql.includes("FROM service_requests sr") && normalizedSql.includes("AND sr.customer_id = $2")) {
          return result<T>([]);
        }

        if (normalizedSql.includes("FROM supporting_documents")) {
          const customerId = String(values[0]);
          const targetId = String(values[1]);

          return result<T>(supportingDocuments.filter(
            (document) =>
              document.customer_id === customerId &&
              (document.service_request_draft_id === targetId || document.service_request_id === targetId)
          ) as T[]);
        }

        if (normalizedSql.startsWith("INSERT INTO supporting_documents")) {
          const row = {
            id: "90000000-0000-4000-8000-000000000001",
            customer_id: String(values[0]),
            service_request_draft_id: values[1] === null ? null : String(values[1]),
            service_request_id: values[2] === null ? null : String(values[2]),
            category: String(values[3]),
            file_name: String(values[4]),
            file_extension: String(values[5]),
            mime_type: String(values[6]),
            size_bytes: Number(values[7]),
            storage_key: String(values[8]),
            upload_status: String(values[9]),
            scan_status: String(values[10]),
            retention_policy: String(values[11]),
            metadata: JSON.parse(String(values[12])),
            created_at: "2026-06-10T00:00:00.000Z",
            updated_at: "2026-06-10T00:00:00.000Z"
          };

          supportingDocuments.push(row);
          return result<T>([row as unknown as T]);
        }

        if (normalizedSql.startsWith("INSERT INTO service_request_events")) {
          const row = {
            id: `80000000-0000-4000-8000-${String(recordedEvents.length + 1).padStart(12, "0")}`,
            service_request_id: String(values[0]),
            event_type: String(values[1]),
            event_payload: JSON.parse(String(values[2])),
            created_at: "2026-06-10T00:00:00.000Z"
          };

          recordedEvents.push(row);
          return result<T>([row as unknown as T]);
        }

        return result<T>([]);
      }
    },
    async ping() {
      return true;
    },
    async close() {
      return;
    }
  };
}

function createSubmittedSupportingDocument(overrides: QueryResultRow = {}): QueryResultRow {
  return {
    id: "90000000-0000-4000-8000-000000000001",
    customer_id: "10000000-0000-4000-8000-000000000001",
    service_request_draft_id: null,
    service_request_id: "30000000-0000-4000-8000-000000000001",
    reference_number: "SSQ-DEMO-0001",
    service_request_status: "SUBMITTED",
    category: "identity",
    file_name: "identity-evidence.pdf",
    file_extension: ".pdf",
    mime_type: "application/pdf",
    size_bytes: 512000,
    storage_key: "prototype-evidence/10000000-0000-4000-8000-000000000001/identity-evidence.pdf",
    upload_status: "STORED_PROTOTYPE",
    scan_status: "AVAILABLE",
    retention_policy: "PROTOTYPE_REVIEW_90_DAYS",
    metadata: {
      personKey: "applicant"
    },
    created_at: "2026-06-10T00:00:00.000Z",
    updated_at: "2026-06-10T00:00:00.000Z",
    ...overrides
  };
}

describe("supporting document upload route", () => {
  it("records allowed upload metadata for a customer-owned draft", async () => {
    const app = await buildApp({
      config: loadConfig({
        NODE_ENV: "test",
        PORT: "7001"
      }),
      database: createUploadTestDatabase()
    });

    const response = await app.inject({
      headers: {
        "content-type": "application/json",
        "x-correlation-id": "upload-correlation"
      },
      method: "POST",
      payload: {
        target: {
          type: "DRAFT",
          draftId: "70000000-0000-4000-8000-000000000001"
        },
        category: "identity",
        fileName: "proof-of-age.pdf",
        mimeType: "application/pdf",
        sizeBytes: 2048
      },
      url: "/uploads/supporting-documents"
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({
      ok: true,
      correlationId: "upload-correlation",
      document: {
        category: "identity",
        fileName: "proof-of-age.pdf",
        mimeType: "application/pdf",
        sizeBytes: 2048,
        uploadStatus: "STORED_PROTOTYPE",
        scanStatus: "AVAILABLE",
        retentionPolicy: "PROTOTYPE_REVIEW_90_DAYS",
        metadata: {
          localStorageMode: "prototype-evidence-storage-adapter",
          personKey: "applicant",
          policy: {
            maxFilesPerPerson: 5,
            maxSizeBytes: 5242880,
            maxTotalSizeBytesPerPerson: 10485760
          },
          scan: {
            engine: "prototype-deterministic-scan",
            status: "AVAILABLE"
          }
        }
      },
      policy: {
        allowedCategories: expect.arrayContaining(["identity", "concession", "supporting-evidence"]),
        allowedPersonKeys: ["applicant"],
        defaultPersonKey: "applicant",
        maxFilesPerPerson: 5,
        maxSizeBytes: 5242880,
        maxTotalSizeBytesPerPerson: 10485760
      }
    });

    await app.close();
  });

  it("returns the transaction-specific upload policy and rejects categories outside it", async () => {
    const seniorsCardApp = await buildApp({
      config: loadConfig({
        NODE_ENV: "test",
        PORT: "7001"
      }),
      database: createUploadTestDatabase({
        transactionKey: "seniors-card"
      })
    });

    const seniorsCardResponse = await seniorsCardApp.inject({
      headers: {
        "content-type": "application/json"
      },
      method: "POST",
      payload: {
        target: {
          type: "DRAFT",
          draftId: "70000000-0000-4000-8000-000000000001"
        },
        category: "income",
        fileName: "income.pdf",
        mimeType: "application/pdf",
        sizeBytes: 2048
      },
      url: "/uploads/supporting-documents"
    });

    expect(seniorsCardResponse.statusCode).toBe(400);
    expect(seniorsCardResponse.json()).toMatchObject({
      ok: false,
      error: {
        code: "UNSUPPORTED_CATEGORY"
      },
      fieldErrors: [
        {
          field: "category"
        }
      ],
      policy: {
        allowedCategories: ["identity", "residency", "concession", "supporting-evidence"],
        allowedPersonKeys: ["applicant"]
      }
    });

    await seniorsCardApp.close();

    const rentalSecuritySubsidyApp = await buildApp({
      config: loadConfig({
        NODE_ENV: "test",
        PORT: "7001"
      }),
      database: createUploadTestDatabase({
        transactionKey: "rental-security-subsidy"
      })
    });

    const rentalSecuritySubsidyResponse = await rentalSecuritySubsidyApp.inject({
      headers: {
        "content-type": "application/json"
      },
      method: "POST",
      payload: {
        target: {
          type: "DRAFT",
          draftId: "70000000-0000-4000-8000-000000000001"
        },
        category: "income",
        fileName: "household-income.pdf",
        mimeType: "application/pdf",
        personKey: "household-member",
        sizeBytes: 2048
      },
      url: "/uploads/supporting-documents"
    });

    expect(rentalSecuritySubsidyResponse.statusCode).toBe(201);
    expect(rentalSecuritySubsidyResponse.json()).toMatchObject({
      ok: true,
      document: {
        category: "income",
        metadata: {
          personKey: "household-member",
          policy: {
            transactionKey: "rental-security-subsidy"
          }
        }
      },
      policy: {
        allowedCategories: ["identity", "residency", "income", "supporting-evidence"],
        allowedPersonKeys: ["applicant", "household-member"]
      }
    });

    const unsupportedPersonResponse = await rentalSecuritySubsidyApp.inject({
      headers: {
        "content-type": "application/json"
      },
      method: "POST",
      payload: {
        target: {
          type: "DRAFT",
          draftId: "70000000-0000-4000-8000-000000000001"
        },
        category: "income",
        fileName: "partner-income.pdf",
        mimeType: "application/pdf",
        personKey: "partner",
        sizeBytes: 2048
      },
      url: "/uploads/supporting-documents"
    });

    expect(unsupportedPersonResponse.statusCode).toBe(400);
    expect(unsupportedPersonResponse.json()).toMatchObject({
      ok: false,
      error: {
        code: "UNSUPPORTED_PERSON_KEY"
      },
      fieldErrors: [
        {
          field: "personKey"
        }
      ]
    });

    await rentalSecuritySubsidyApp.close();
  });

  it("rejects unsupported file metadata", async () => {
    const app = await buildApp({
      config: loadConfig({
        NODE_ENV: "test",
        PORT: "7001"
      }),
      database: createUploadTestDatabase()
    });

    const response = await app.inject({
      headers: {
        "content-type": "application/json"
      },
      method: "POST",
      payload: {
        target: {
          type: "DRAFT",
          draftId: "70000000-0000-4000-8000-000000000001"
        },
        category: "identity",
        fileName: "proof.exe",
        mimeType: "application/pdf",
        sizeBytes: 2048
      },
      url: "/uploads/supporting-documents"
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({
      ok: false,
      error: {
        code: "UNSUPPORTED_FILE_TYPE"
      },
      fieldErrors: [
        {
          field: "fileName"
        }
      ]
    });

    await app.close();
  });

  it("rejects upload metadata that exceeds the per-person file limit", async () => {
    const app = await buildApp({
      config: loadConfig({
        NODE_ENV: "test",
        PORT: "7001"
      }),
      database: createUploadTestDatabase()
    });
    const basePayload = {
      target: {
        type: "DRAFT",
        draftId: "70000000-0000-4000-8000-000000000001"
      },
      category: "identity",
      mimeType: "application/pdf",
      personKey: "applicant",
      sizeBytes: 2048
    };

    for (let index = 0; index < 5; index += 1) {
      const response = await app.inject({
        headers: {
          "content-type": "application/json"
        },
        method: "POST",
        payload: {
          ...basePayload,
          fileName: `proof-${index}.pdf`
        },
        url: "/uploads/supporting-documents"
      });

      expect(response.statusCode).toBe(201);
    }

    const response = await app.inject({
      headers: {
        "content-type": "application/json"
      },
      method: "POST",
      payload: {
        ...basePayload,
        fileName: "proof-extra.pdf"
      },
      url: "/uploads/supporting-documents"
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({
      ok: false,
      error: {
        code: "PERSON_LIMIT_EXCEEDED"
      },
      fieldErrors: [
        {
          field: "personKey"
        }
      ],
      policy: {
        maxFilesPerPerson: 5,
        maxTotalSizeBytesPerPerson: 10485760
      }
    });

    await app.close();
  });

  it("downloads an available customer-owned submitted supporting document", async () => {
    const recordedEvents: QueryResultRow[] = [];
    const app = await buildApp({
      config: loadConfig({
        NODE_ENV: "test",
        PORT: "7001"
      }),
      database: createUploadTestDatabase({
        recordedEvents,
        seedSupportingDocuments: [
          createSubmittedSupportingDocument()
        ]
      })
    });

    const response = await app.inject({
      headers: {
        "x-correlation-id": "download-correlation"
      },
      method: "GET",
      url: "/service-requests/SSQ-DEMO-0001/supporting-documents/90000000-0000-4000-8000-000000000001/download"
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers["content-type"]).toContain("text/plain");
    expect(response.headers["content-disposition"]).toBe('attachment; filename="identity-evidence.pdf.prototype.txt"');
    expect(response.body).toContain("Original filename: identity-evidence.pdf");
    expect(response.body).toContain("Storage key: prototype-evidence/10000000-0000-4000-8000-000000000001/identity-evidence.pdf");
    expect(recordedEvents).toEqual([
      expect.objectContaining({
        service_request_id: "30000000-0000-4000-8000-000000000001",
        event_type: "SUPPORTING_DOCUMENT_DOWNLOADED",
        event_payload: expect.objectContaining({
          actorRole: "Citizen",
          actorSubject: "demo.customer@example.test",
          correlationId: "download-correlation",
          documentId: "90000000-0000-4000-8000-000000000001",
          scanStatus: "AVAILABLE"
        })
      })
    ]);

    await app.close();
  });

  it("allows staff roles to download submitted supporting documents", async () => {
    const recordedEvents: QueryResultRow[] = [];
    const app = await buildApp({
      config: loadConfig({
        NODE_ENV: "test",
        PORT: "7001"
      }),
      database: createUploadTestDatabase({
        recordedEvents,
        seedSupportingDocuments: [
          createSubmittedSupportingDocument({
            customer_id: "10000000-0000-4000-8000-000000000999"
          })
        ]
      })
    });

    const response = await app.inject({
      headers: {
        "x-ssq-demo-role": "ServiceOfficer",
        "x-ssq-demo-subject": "officer@example.test"
      },
      method: "GET",
      url: "/service-requests/SSQ-DEMO-0001/supporting-documents/90000000-0000-4000-8000-000000000001/download"
    });

    expect(response.statusCode).toBe(200);
    expect(recordedEvents).toEqual([
      expect.objectContaining({
        event_type: "SUPPORTING_DOCUMENT_DOWNLOADED",
        event_payload: expect.objectContaining({
          actorRole: "ServiceOfficer",
          actorSubject: "officer@example.test",
          documentId: "90000000-0000-4000-8000-000000000001"
        })
      })
    ]);

    await app.close();
  });

  it("does not download another customer's submitted supporting document for a citizen", async () => {
    const recordedEvents: QueryResultRow[] = [];
    const app = await buildApp({
      config: loadConfig({
        NODE_ENV: "test",
        PORT: "7001"
      }),
      database: createUploadTestDatabase({
        recordedEvents,
        seedSupportingDocuments: [
          createSubmittedSupportingDocument({
            customer_id: "10000000-0000-4000-8000-000000000999"
          })
        ]
      })
    });

    const response = await app.inject({
      method: "GET",
      url: "/service-requests/SSQ-DEMO-0001/supporting-documents/90000000-0000-4000-8000-000000000001/download"
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toMatchObject({
      ok: false,
      error: {
        code: "DOCUMENT_NOT_FOUND"
      }
    });
    expect(recordedEvents).toEqual([]);

    await app.close();
  });

  it("blocks unavailable submitted supporting document downloads with an audit event", async () => {
    const recordedEvents: QueryResultRow[] = [];
    const app = await buildApp({
      config: loadConfig({
        NODE_ENV: "test",
        PORT: "7001"
      }),
      database: createUploadTestDatabase({
        recordedEvents,
        seedSupportingDocuments: [
          createSubmittedSupportingDocument({
            scan_status: "QUARANTINED"
          })
        ]
      })
    });

    const response = await app.inject({
      headers: {
        "x-correlation-id": "blocked-download-correlation"
      },
      method: "GET",
      url: "/service-requests/SSQ-DEMO-0001/supporting-documents/90000000-0000-4000-8000-000000000001/download"
    });

    expect(response.statusCode).toBe(409);
    expect(response.json()).toMatchObject({
      ok: false,
      error: {
        code: "DOCUMENT_NOT_AVAILABLE"
      },
      correlationId: "blocked-download-correlation"
    });
    expect(recordedEvents).toEqual([
      expect.objectContaining({
        service_request_id: "30000000-0000-4000-8000-000000000001",
        event_type: "SUPPORTING_DOCUMENT_DOWNLOAD_BLOCKED",
        event_payload: expect.objectContaining({
          correlationId: "blocked-download-correlation",
          documentId: "90000000-0000-4000-8000-000000000001",
          reason: "DOCUMENT_NOT_AVAILABLE",
          scanStatus: "QUARANTINED"
        })
      })
    ]);

    await app.close();
  });

  it("cannot attach upload metadata to another customer's draft", async () => {
    const app = await buildApp({
      config: loadConfig({
        NODE_ENV: "test",
        PORT: "7001"
      }),
      database: createUploadTestDatabase()
    });

    const response = await app.inject({
      headers: {
        "content-type": "application/json"
      },
      method: "POST",
      payload: {
        target: {
          type: "DRAFT",
          draftId: "70000000-0000-4000-8000-000000000001"
        },
        category: "identity",
        fileName: "proof.pdf",
        mimeType: "application/pdf",
        sizeBytes: 2048
      },
      url: "/uploads/supporting-documents"
    });

    expect(response.statusCode).toBe(201);

    const otherCustomerResponse = await app.inject({
      headers: {
        "content-type": "application/json",
        "x-demo-customer-email": "other.customer@example.test"
      },
      method: "POST",
      payload: {
        target: {
          type: "DRAFT",
          draftId: "70000000-0000-4000-8000-000000000001"
        },
        category: "identity",
        fileName: "proof.pdf",
        mimeType: "application/pdf",
        sizeBytes: 2048
      },
      url: "/uploads/supporting-documents"
    });

    expect(otherCustomerResponse.statusCode).toBe(404);
    expect(otherCustomerResponse.json()).toMatchObject({
      ok: false,
      error: {
        code: "TARGET_NOT_FOUND"
      }
    });

    await app.close();
  });
});

function result<T extends QueryResultRow>(rows: T[]): QueryResult<T> {
  return {
    command: "SELECT",
    fields: [],
    oid: 0,
    rowCount: rows.length,
    rows
  };
}
