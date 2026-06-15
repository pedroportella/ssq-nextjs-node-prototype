import { expect, type Page, test } from "@playwright/test";

const forbiddenRequestPatterns = [/localhost:7001/, /127\.0\.0\.1:7001/, /backend:7001/, /\/graphql(?:\?|$)/];

const viewports = [
  { height: 900, name: "desktop", width: 1440 },
  { height: 844, name: "mobile", width: 390 }
] as const;

const pages = [
  {
    heading: "SSQ Service Dashboard",
    keyText: "Frontend mock runtime",
    name: "dashboard-home",
    url: "http://localhost:3000"
  },
  {
    heading: "Seniors Card",
    keyText: "Frontend-only workflow",
    name: "seniors-card-overview",
    url: "http://localhost:3001"
  },
  {
    heading: "Check your eligibility",
    keyText: "Enter a date of birth that confirms eligibility.",
    name: "seniors-card-apply",
    url: "http://localhost:3001/apply"
  },
  {
    heading: "Seniors Card application status",
    keyText: "Download submission summary",
    name: "seniors-card-status",
    url: "http://localhost:3001/application-status"
  },
  {
    heading: "Rental Security Subsidy",
    keyText: "Frontend-only rental workflow",
    name: "rental-security-subsidy-overview",
    url: "http://localhost:3002"
  },
  {
    heading: "Prepare your rental support application",
    keyText: "Enter the weekly rent amount for the property.",
    name: "rental-security-subsidy-apply",
    url: "http://localhost:3002/apply"
  },
  {
    heading: "Rental Security Subsidy application status",
    keyText: "Download submission summary",
    name: "rental-security-subsidy-status",
    url: "http://localhost:3002/application-status"
  }
] as const;

const visualStabilityCss = `
  *,
  *::before,
  *::after {
    animation-delay: 0s !important;
    animation-duration: 0s !important;
    scroll-behavior: auto !important;
    transition-delay: 0s !important;
    transition-duration: 0s !important;
  }

  nextjs-portal,
  [aria-label="Next.js Dev Tools"],
  [aria-label="Open Next.js Dev Tools"],
  [data-nextjs-dev-tools-button],
  [data-nextjs-dialog],
  [data-nextjs-dialog-overlay],
  [data-nextjs-toast] {
    display: none !important;
  }
`;

async function waitForStablePage(page: Page) {
  await page.addStyleTag({ content: visualStabilityCss });
  await page.evaluate(async () => {
    await document.fonts?.ready;
  });
}

for (const viewport of viewports) {
  test.describe(`QHDS visual baselines - ${viewport.name}`, () => {
    test.use({
      colorScheme: "light",
      reducedMotion: "reduce",
      viewport: {
        height: viewport.height,
        width: viewport.width
      }
    });

    for (const pageTarget of pages) {
      test(`${pageTarget.name} matches the approved ${viewport.name} baseline`, async ({ page }) => {
        const forbiddenRequests: string[] = [];

        page.on("request", (request) => {
          const url = request.url();

          if (forbiddenRequestPatterns.some((pattern) => pattern.test(url))) {
            forbiddenRequests.push(url);
          }
        });

        await page.goto(pageTarget.url);
        await expect(page.getByRole("heading", { level: 1, name: pageTarget.heading })).toBeVisible();
        await expect(page.getByText(pageTarget.keyText)).toBeVisible();
        await waitForStablePage(page);

        expect(forbiddenRequests).toEqual([]);
        await expect(page).toHaveScreenshot(`${pageTarget.name}-${viewport.name}.png`, {
          animations: "disabled",
          caret: "hide",
          fullPage: true,
          maxDiffPixelRatio: 0.02,
          threshold: 0.25
        });
      });
    }
  });
}
