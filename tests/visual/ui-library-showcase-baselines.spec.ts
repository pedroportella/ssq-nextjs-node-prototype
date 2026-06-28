import { expect, type Page, test } from "@playwright/test";

const forbiddenRequestPatterns = [/localhost:7001/, /127\.0\.0\.1:7001/, /backend:7001/, /\/graphql(?:\?|$)/];

const viewports = [
  { height: 900, name: "desktop", width: 1440 },
  { height: 844, name: "mobile", width: 390 }
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
  test.describe(`UI Library showcase baselines - ${viewport.name}`, () => {
    test.use({
      colorScheme: "light",
      reducedMotion: "reduce",
      viewport: {
        height: viewport.height,
        width: viewport.width
      }
    });

    test(`ui-library-showcase matches the approved ${viewport.name} baseline`, async ({ page }) => {
      const forbiddenRequests: string[] = [];

      page.on("request", (request) => {
        const url = request.url();

        if (forbiddenRequestPatterns.some((pattern) => pattern.test(url))) {
          forbiddenRequests.push(url);
        }
      });

      await page.goto("http://localhost:3300/ui-library");
      await expect(page.getByRole("heading", { level: 1, name: "UI Library showcase" })).toBeVisible();
      await expect(page.getByRole("heading", { name: "Upload states" })).toBeVisible();
      await waitForStablePage(page);

      expect(forbiddenRequests).toEqual([]);
      await expect(page).toHaveScreenshot(`ui-library-showcase-${viewport.name}.png`, {
        animations: "disabled",
        caret: "hide",
        fullPage: true,
        maxDiffPixelRatio: 0.02,
        threshold: 0.25
      });
    });
  });
}
