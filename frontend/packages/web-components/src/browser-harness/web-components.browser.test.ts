import { AxeBuilder } from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("components render in light and dark theme contexts", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator("ssq-button#primary-action")).toBeVisible();
  await expect(page.locator("ssq-button#secondary-action")).toBeVisible();
  await expect(page.locator("ssq-text-input#full-name")).toBeVisible();
  await expect(page.locator("ssq-select#card-type")).toBeVisible();
  await expect(page.locator("ssq-checkbox#terms")).toBeVisible();
  await expect(page.locator("ssq-radio-group#contact-method")).toBeVisible();

  await expect(page.locator("ssq-button#primary-action").locator("button")).toHaveClass(/ssq-button--primary/);
  await expect(page.locator("ssq-button#secondary-action").locator("button")).toHaveClass(/ssq-button--secondary/);
});

test("components emit composed interaction details from shadow DOM", async ({ page }) => {
  await page.goto("/");

  await page.evaluate(() => {
    const events: Array<{ composed: boolean; detail: unknown; type: string }> = [];
    const eventNames = ["ssq-click", "ssq-input", "ssq-change"];

    for (const eventName of eventNames) {
      document.addEventListener(eventName, (event) => {
        const customEvent = event as CustomEvent;
        events.push({
          composed: customEvent.composed,
          detail: customEvent.detail,
          type: customEvent.type
        });
      });
    }

    window.ssqHarnessEvents = events;
  });

  await page.locator("ssq-button#primary-action").locator("button").click();
  await page.locator("ssq-text-input#full-name").locator("input").fill("Ada Lovelace");
  await page.locator("ssq-text-input#full-name").locator("input").blur();
  await page.locator("ssq-select#card-type").locator("select").selectOption("business");
  await page.locator("ssq-checkbox#terms").locator("input").check();
  await page.locator("ssq-radio-group#contact-method").locator("input[value='phone']").check();

  await expect
    .poll(() => page.evaluate(() => window.ssqHarnessEvents))
    .toEqual([
      { composed: true, detail: { href: undefined, variant: "primary" }, type: "ssq-click" },
      { composed: true, detail: { value: "Ada Lovelace" }, type: "ssq-input" },
      { composed: true, detail: { value: "Ada Lovelace" }, type: "ssq-change" },
      { composed: true, detail: { value: "business" }, type: "ssq-change" },
      { composed: true, detail: { checked: true, value: "on" }, type: "ssq-change" },
      { composed: true, detail: { value: "phone" }, type: "ssq-change" }
    ]);
});

test("harness has no detectable a11y violations", async ({ page }) => {
  await page.goto("/");

  const results = await new AxeBuilder({ page }).include("#app").analyze();

  expect(results.violations).toEqual([]);
});

declare global {
  interface Window {
    ssqHarnessEvents: Array<{ composed: boolean; detail: unknown; type: string }>;
  }
}
