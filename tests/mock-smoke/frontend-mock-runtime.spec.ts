import { expect, test } from "@playwright/test";
import { isMockSmokeAppSelected, selectedMockSmokeApps } from "./app-selection";

const forbiddenRequestPatterns = [/localhost:7001/, /127\.0\.0\.1:7001/, /backend:7001/, /\/graphql(?:\?|$)/];

for (const app of selectedMockSmokeApps) {
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

if (isMockSmokeAppSelected("seniors-card")) {
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
    const seniorsApplyForm = page.locator("form.qld__form");
    await expect(seniorsApplyForm).toContainText("SC-2026-0001");
    await expect(seniorsApplyForm.locator(".qld__card, .ssq-card")).toHaveCount(0);

    await page.goto("http://localhost:3001/application-status");
    await expect(page.getByRole("heading", { level: 1, name: "Seniors Card application status" })).toBeVisible();
    await expect(page.getByText("Application submitted")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Application submitted" }).locator("xpath=ancestor::aside")).toContainText("SC-2026-0001");
    await expect(page.getByText("Download submission summary")).toBeVisible();
    await expect(page.getByText("identity-evidence.pdf")).toBeVisible();

    expect(forbiddenRequests).toEqual([]);
  });
}

if (isMockSmokeAppSelected("rental-security-subsidy")) {
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
    const rentalApplyForm = page.locator("form.qld__form");
    await expect(rentalApplyForm).toContainText("RSS-2026-0001");
    await expect(rentalApplyForm.locator(".qld__card, .ssq-card")).toHaveCount(0);

    await page.goto("http://localhost:3002/application-status");
    await expect(page.getByRole("heading", { level: 1, name: "Rental Security Subsidy application status" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Application submitted" }).locator("xpath=ancestor::aside")).toContainText("RSS-2026-0001");
    await expect(page.getByText("Download submission summary")).toBeVisible();
    await expect(page.getByText("rental-property-evidence.pdf")).toBeVisible();

    expect(forbiddenRequests).toEqual([]);
  });
}
