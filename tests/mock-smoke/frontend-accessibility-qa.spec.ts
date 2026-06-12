import { expect, type Page, test } from "@playwright/test";

const forbiddenRequestPatterns = [/localhost:7001/, /127\.0\.0\.1:7001/, /backend:7001/, /\/graphql(?:\?|$)/];

const viewports = [
  { height: 900, name: "desktop", width: 1440 },
  { height: 844, name: "mobile", width: 390 }
] as const;

const pages = [
  {
    app: "dashboard",
    heading: "SSQ Service Dashboard",
    keyText: "Frontend mock runtime",
    path: "/",
    url: "http://localhost:3000"
  },
  {
    app: "seniors-card",
    heading: "Seniors Card",
    keyText: "Frontend-only workflow",
    path: "/",
    url: "http://localhost:3001"
  },
  {
    app: "seniors-card",
    heading: "Check your eligibility",
    keyText: "Enter a date of birth that confirms eligibility.",
    path: "/apply",
    url: "http://localhost:3001/apply"
  },
  {
    app: "seniors-card",
    heading: "Seniors Card application status",
    keyText: "Download submission summary",
    path: "/application-status",
    url: "http://localhost:3001/application-status"
  },
  {
    app: "rental-security-subsidy",
    heading: "Rental Security Subsidy",
    keyText: "Frontend-only rental workflow",
    path: "/",
    url: "http://localhost:3002"
  },
  {
    app: "rental-security-subsidy",
    heading: "Prepare your rental support application",
    keyText: "Enter the weekly rent amount for the property.",
    path: "/apply",
    url: "http://localhost:3002/apply"
  },
  {
    app: "rental-security-subsidy",
    heading: "Rental Security Subsidy application status",
    keyText: "Download submission summary",
    path: "/application-status",
    url: "http://localhost:3002/application-status"
  }
] as const;

function trackForbiddenRequests(page: Page) {
  const forbiddenRequests: string[] = [];

  page.on("request", (request) => {
    const url = request.url();

    if (forbiddenRequestPatterns.some((pattern) => pattern.test(url))) {
      forbiddenRequests.push(url);
    }
  });

  return forbiddenRequests;
}

async function expectNoVisibleHorizontalOverflow(page: Page) {
  const overflowingElements = await page.locator("body *").evaluateAll((elements) => {
    const viewportWidth = document.documentElement.clientWidth;

    return elements
      .flatMap((element) => {
        if (!(element instanceof HTMLElement)) {
          return [];
        }

        const style = window.getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        const isVisible = rect.width > 0 && rect.height > 0 && style.display !== "none" && style.visibility !== "hidden";
        const overflows = rect.left < -1 || rect.right > viewportWidth + 1;

        return isVisible && overflows ? [`${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ""}.${Array.from(element.classList).join(".")}`] : [];
      })
      .slice(0, 10);
  });

  expect(overflowingElements).toEqual([]);
}

async function expectQhdsGridFoundation(page: Page, viewportWidth: number) {
  const gridState = await page.evaluate(() => {
    const containers = Array.from(document.querySelectorAll<HTMLElement>(".qld__grid .container, .qld__grid .container-fluid"));
    const rows = Array.from(document.querySelectorAll<HTMLElement>(".qld__grid .row"));
    const columns = Array.from(document.querySelectorAll<HTMLElement>('.qld__grid .row > [class*="col-"]'));

    return {
      columnClassNames: columns.map((column) => column.className),
      headerContainerWidths: containers
        .filter((container) => Boolean(container.closest(".qld__header")))
        .map((container) => container.getBoundingClientRect().width),
      contentContainerWidths: containers
        .filter((container) => !container.closest(".qld__header"))
        .map((container) => container.getBoundingClientRect().width),
      desktopColumnWidths: columns
        .filter((column) => /\bcol-lg-[1-9]\b/.test(column.className))
        .map((column) => {
          const row = column.closest(".row");
          return {
            column: column.getBoundingClientRect().width,
            row: row?.getBoundingClientRect().width ?? 0
          };
        }),
      hasGridRoot: Boolean(document.querySelector(".qld__grid")),
      rowCount: rows.length
    };
  });

  expect(gridState.hasGridRoot).toBe(true);
  expect(gridState.contentContainerWidths.length + gridState.headerContainerWidths.length).toBeGreaterThanOrEqual(1);
  expect(Math.max(...gridState.contentContainerWidths)).toBeLessThanOrEqual(Math.min(viewportWidth, 1376) + 1);
  expect(Math.max(...gridState.headerContainerWidths)).toBeLessThanOrEqual(viewportWidth + 1);
  expect(gridState.rowCount).toBeGreaterThanOrEqual(1);
  expect(gridState.columnClassNames.some((className) => className.includes("col-xs-12"))).toBe(true);

  if (viewportWidth >= 992) {
    expect(gridState.columnClassNames.some((className) => /col-lg-[1-9]/.test(className))).toBe(true);
    expect(gridState.desktopColumnWidths.some((widths) => widths.column > 0 && widths.column < widths.row)).toBe(true);
  }
}

async function expectFocusedElementHasVisibleFocus(page: Page) {
  await page.keyboard.press("Tab");
  await page.waitForFunction(() => document.activeElement !== document.body);

  const focusState = await page.evaluate(() => {
    const element = document.activeElement;

    if (!(element instanceof HTMLElement)) {
      return { hasVisibleFocus: false, tagName: "none" };
    }

    const style = window.getComputedStyle(element);
    const outlineWidth = Number.parseFloat(style.outlineWidth);
    const hasOutline = style.outlineStyle !== "none" && outlineWidth > 0;

    return {
      hasVisibleFocus: hasOutline || style.boxShadow !== "none",
      tagName: element.tagName.toLowerCase(),
      text: element.innerText || element.getAttribute("aria-label") || element.getAttribute("name") || ""
    };
  });

  expect(focusState).toMatchObject({ hasVisibleFocus: true });
}

async function expectSingleVisibleH1(page: Page, name: string) {
  await expect(page.getByRole("heading", { level: 1, name })).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
}

for (const viewport of viewports) {
  test.describe(`frontend visual/accessibility QA - ${viewport.name}`, () => {
    for (const pageTarget of pages) {
      test(`${pageTarget.app}${pageTarget.path} has landmarks, readable layout and no backend requests`, async ({ page }) => {
        const forbiddenRequests = trackForbiddenRequests(page);

        await page.setViewportSize({ height: viewport.height, width: viewport.width });
        await page.goto(pageTarget.url);

        await expectSingleVisibleH1(page, pageTarget.heading);
        await expect(page.getByText(pageTarget.keyText)).toBeVisible();
        await expect(page.getByRole("main")).toBeVisible();
        await expectNoVisibleHorizontalOverflow(page);
        await expectQhdsGridFoundation(page, viewport.width);
        await expectFocusedElementHasVisibleFocus(page);
        expect(forbiddenRequests).toEqual([]);
      });
    }
  });
}

test("transaction form validation states are accessible in mock mode", async ({ page }) => {
  const forbiddenRequests = trackForbiddenRequests(page);

  await page.goto("http://localhost:3001/apply");
  const dateOfBirth = page.getByLabel("Date of birth");
  await expect(dateOfBirth).toHaveAttribute("aria-invalid", "true");
  await expect(dateOfBirth).toHaveAttribute("aria-describedby", /error/);
  await expect(page.getByText("Enter a date of birth that confirms eligibility.")).toBeVisible();
  await expect(dateOfBirth).toBeVisible();

  await page.goto("http://localhost:3002/apply");
  const weeklyRent = page.getByLabel("Weekly rent");
  await expect(weeklyRent).toHaveAttribute("aria-invalid", "true");
  await expect(weeklyRent).toHaveAttribute("aria-describedby", /error/);
  await expect(page.getByText("Enter the weekly rent amount for the property.")).toBeVisible();
  await expect(weeklyRent).toBeVisible();

  expect(forbiddenRequests).toEqual([]);
});

test("status pages expose upload and download controls with accessible names", async ({ page }) => {
  const forbiddenRequests = trackForbiddenRequests(page);

  await page.goto("http://localhost:3001/application-status");
  await expect(page.getByRole("link", { name: "Download submission summary" })).toBeVisible();
  await expect(page.getByLabel("Upload supporting documents")).toHaveAttribute("type", "file");
  await expect(page.getByText("identity-archive.zip")).toBeVisible();

  await page.goto("http://localhost:3002/application-status");
  await expect(page.getByRole("link", { name: "Download submission summary" })).toBeVisible();
  await expect(page.getByLabel("Upload supporting documents")).toHaveAttribute("type", "file");
  await expect(page.getByText("rental-property-archive.zip")).toBeVisible();

  expect(forbiddenRequests).toEqual([]);
});
