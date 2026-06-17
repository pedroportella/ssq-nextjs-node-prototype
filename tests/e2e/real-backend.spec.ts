import { expect, test, type APIRequestContext, type Page } from "@playwright/test";

const endpoints = {
  backend: process.env.SSQ_E2E_BACKEND_URL ?? "http://127.0.0.1:7001",
  dashboard: process.env.SSQ_E2E_DASHBOARD_URL ?? "http://127.0.0.1:3000",
  rentalSecuritySubsidy: process.env.SSQ_E2E_RENTAL_SECURITY_SUBSIDY_URL ?? "http://127.0.0.1:3002",
  seniorsCard: process.env.SSQ_E2E_SENIORS_CARD_URL ?? "http://127.0.0.1:3001"
};

const referenceNumberPattern = /SSQ-\d{8}-[A-F0-9]{8}/;

interface TransactionE2EConfig {
  applyHeading: string;
  applyUrl: string;
  documentCategory: string;
  documentFileName: string;
  documentPersonKey: string;
  fullNameLabel: string;
  serviceLabel: string;
}

const transactionConfigs: TransactionE2EConfig[] = [
  {
    applyHeading: "Check your eligibility",
    applyUrl: `${endpoints.seniorsCard}/apply`,
    documentCategory: "identity",
    documentFileName: "seniors-card-e2e-identity.pdf",
    documentPersonKey: "applicant",
    fullNameLabel: "Full name",
    serviceLabel: "Seniors Card"
  },
  {
    applyHeading: "Prepare your rental support application",
    applyUrl: `${endpoints.rentalSecuritySubsidy}/apply`,
    documentCategory: "supporting-evidence",
    documentFileName: "rental-security-subsidy-e2e-evidence.pdf",
    documentPersonKey: "applicant",
    fullNameLabel: "Full name",
    serviceLabel: "Rental Security Subsidy"
  }
];

test.describe.configure({ mode: "serial" });

test.beforeAll(async ({ request }) => {
  await expectEndpointReady(request, `${endpoints.backend}/health/ready`);
  await expectEndpointReady(request, `${endpoints.dashboard}/status`);
  await expectEndpointReady(request, `${endpoints.seniorsCard}/status`);
  await expectEndpointReady(request, `${endpoints.rentalSecuritySubsidy}/status`);
});

test("dashboard renders backend-backed customer data", async ({ page }) => {
  await page.goto(endpoints.dashboard);

  await expect(page.getByRole("heading", { level: 1, name: "SSQ Service Dashboard" })).toBeVisible();
  await expect(page.getByText("demo.customer", { exact: true })).toBeVisible();
  await expect(page.getByText("demo.customer@example.test")).toBeVisible();
  await expect(page.getByText("avery.taylor@example.test")).toHaveCount(0);
});

for (const transaction of transactionConfigs) {
  test(`${transaction.serviceLabel} creates a backend-backed submission and records document metadata`, async ({
    page,
    request
  }) => {
    await page.goto(transaction.applyUrl);

    await expect(page.getByRole("heading", { level: 1, name: transaction.applyHeading })).toBeVisible();
    await expect(page.getByLabel(transaction.fullNameLabel)).toHaveValue("Taylor Queensland");

    const referenceNumber = await readReferenceNumber(page);
    expect(referenceNumber).toMatch(referenceNumberPattern);

    await recordSupportingDocument(request, {
      category: transaction.documentCategory,
      fileName: transaction.documentFileName,
      personKey: transaction.documentPersonKey,
      referenceNumber
    });
    await expectSupportingDocumentRecorded(request, referenceNumber, transaction.documentFileName);

    await page.goto(`${endpoints.dashboard}#submitted-requests`);
    const submittedRequests = page.locator("#submitted-requests");

    await expect(submittedRequests.getByText(referenceNumber)).toBeVisible();
    await expect(submittedRequests.getByRole("link", { name: transaction.serviceLabel }).first()).toBeVisible();
  });
}

async function expectEndpointReady(request: APIRequestContext, url: string) {
  await expect.poll(async () => {
    const response = await request.get(url, {
      failOnStatusCode: false
    });

    return response.ok();
  }, {
    message: `${url} should be ready`,
    timeout: 120_000
  }).toBe(true);
}

async function readReferenceNumber(page: Page) {
  const bodyText = await page.locator("body").innerText();
  const referenceNumber = bodyText.match(referenceNumberPattern)?.[0];

  if (!referenceNumber) {
    throw new Error("Unable to find a backend-generated SSQ reference number on the page.");
  }

  return referenceNumber;
}

async function recordSupportingDocument(
  request: APIRequestContext,
  input: {
    category: string;
    fileName: string;
    personKey: string;
    referenceNumber: string;
  }
) {
  const response = await request.post(`${endpoints.backend}/uploads/supporting-documents`, {
    data: {
      category: input.category,
      fileName: input.fileName,
      mimeType: "application/pdf",
      personKey: input.personKey,
      sizeBytes: 4096,
      target: {
        referenceNumber: input.referenceNumber,
        type: "SERVICE_REQUEST"
      }
    },
    failOnStatusCode: false,
    headers: {
      "x-correlation-id": `ssq-real-e2e-${input.referenceNumber}`
    }
  });

  expect(response.status()).toBe(201);
  expect(await response.json()).toMatchObject({
    document: {
      fileName: input.fileName,
      scanStatus: "AVAILABLE",
      uploadStatus: "STORED_PROTOTYPE"
    },
    ok: true
  });
}

async function expectSupportingDocumentRecorded(
  request: APIRequestContext,
  referenceNumber: string,
  fileName: string
) {
  const response = await request.post(`${endpoints.backend}/graphql`, {
    data: {
      query: `
        query E2ESupportingDocuments($referenceNumber: String) {
          supportingDocuments(referenceNumber: $referenceNumber) {
            fileName
            uploadStatus
            scanStatus
          }
        }
      `,
      variables: {
        referenceNumber
      }
    },
    headers: {
      "x-correlation-id": `ssq-real-e2e-graphql-${referenceNumber}`
    }
  });
  const payload = await response.json() as {
    data?: {
      supportingDocuments?: Array<{
        fileName: string;
        scanStatus: string;
        uploadStatus: string;
      }>;
    };
  };

  expect(payload.data?.supportingDocuments).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        fileName,
        scanStatus: "AVAILABLE",
        uploadStatus: "STORED_PROTOTYPE"
      })
    ])
  );
}
