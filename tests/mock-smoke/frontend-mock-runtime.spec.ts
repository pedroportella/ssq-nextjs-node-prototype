import { expect, test } from "@playwright/test";

const apps = [
  {
    heading: "SSQ Service Dashboard",
    name: "dashboard",
    url: "http://localhost:3000"
  },
  {
    heading: "Seniors Card",
    name: "seniors-card",
    url: "http://localhost:3001"
  },
  {
    heading: "Rental Security Subsidy",
    name: "rental-security-subsidy",
    url: "http://localhost:3002"
  }
] as const;

const forbiddenRequestPatterns = [/localhost:7001/, /127\.0\.0\.1:7001/, /backend:7001/, /\/graphql(?:\?|$)/];

for (const app of apps) {
  test(`${app.name} renders in mock mode without backend requests`, async ({ page }) => {
    const forbiddenRequests: string[] = [];

    page.on("request", (request) => {
      const url = request.url();

      if (forbiddenRequestPatterns.some((pattern) => pattern.test(url))) {
        forbiddenRequests.push(url);
      }
    });

    await page.goto(app.url);

    await expect(page.getByRole("heading", { level: 1, name: app.heading })).toBeVisible();
    expect(forbiddenRequests).toEqual([]);
  });
}

test("seniors-card workflow renders apply and status pages in mock mode", async ({ page }) => {
  const forbiddenRequests: string[] = [];

  page.on("request", (request) => {
    const url = request.url();

    if (forbiddenRequestPatterns.some((pattern) => pattern.test(url))) {
      forbiddenRequests.push(url);
    }
  });

  await page.goto("http://localhost:3001/apply");
  await expect(page.getByRole("heading", { level: 1, name: "Check your eligibility" })).toBeVisible();
  await expect(page.getByText("Enter a date of birth that confirms eligibility.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Submit result" }).locator("xpath=ancestor::article")).toContainText("SC-2026-0001");

  await page.goto("http://localhost:3001/application-status");
  await expect(page.getByRole("heading", { level: 1, name: "Seniors Card application status" })).toBeVisible();
  await expect(page.getByText("Application submitted")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Application submitted" }).locator("xpath=ancestor::aside")).toContainText("SC-2026-0001");
  await expect(page.getByText("Download submission summary")).toBeVisible();
  await expect(page.getByText("identity-evidence.pdf")).toBeVisible();

  expect(forbiddenRequests).toEqual([]);
});

test("rental-security-subsidy workflow renders apply and status pages in mock mode", async ({ page }) => {
  const forbiddenRequests: string[] = [];

  page.on("request", (request) => {
    const url = request.url();

    if (forbiddenRequestPatterns.some((pattern) => pattern.test(url))) {
      forbiddenRequests.push(url);
    }
  });

  await page.goto("http://localhost:3002/apply");
  await expect(page.getByRole("heading", { level: 1, name: "Prepare your rental support application" })).toBeVisible();
  await expect(page.getByText("Enter the weekly rent amount for the property.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Submit result" }).locator("xpath=ancestor::article")).toContainText("RSS-2026-0001");

  await page.goto("http://localhost:3002/application-status");
  await expect(page.getByRole("heading", { level: 1, name: "Rental Security Subsidy application status" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Application submitted" }).locator("xpath=ancestor::aside")).toContainText("RSS-2026-0001");
  await expect(page.getByText("Download submission summary")).toBeVisible();
  await expect(page.getByText("rental-property-evidence.pdf")).toBeVisible();

  expect(forbiddenRequests).toEqual([]);
});
