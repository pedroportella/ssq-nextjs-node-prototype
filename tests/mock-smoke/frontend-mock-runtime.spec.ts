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
