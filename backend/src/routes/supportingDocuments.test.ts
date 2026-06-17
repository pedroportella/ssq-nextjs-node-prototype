import { describe, expect, it } from "vitest";

import { buildApp } from "../app.js";
import { loadConfig } from "../config.js";

import type { DatabaseClient } from "../database/client.js";
import type { QueryResult, QueryResultRow } from "pg";

function createUploadTestDatabase(options: { transactionKey?: string } = {}): DatabaseClient {
  const supportingDocuments: QueryResultRow[] = [];
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
        uploadStatus: "METADATA_RECORDED",
        scanStatus: "NOT_SCANNED_PROTOTYPE",
        retentionPolicy: "PRODUCTION_NEXT_REQUIRED",
        metadata: {
          localStorageMode: "metadata-only",
          personKey: "applicant",
          policy: {
            maxFilesPerPerson: 5,
            maxSizeBytes: 5242880,
            maxTotalSizeBytesPerPerson: 10485760
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
