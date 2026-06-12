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

async function expectQhdsThemeFoundation(page: Page, viewportWidth: number) {
  const themeState = await page.evaluate(() => {
    const h1 = document.querySelector("h1");
    const lead = document.querySelector<HTMLElement>('[class*="lead"]');
    const footerLink = document.querySelector<HTMLElement>(".qld__footer a");
    const rootStyle = window.getComputedStyle(document.documentElement);
    const bodyStyle = window.getComputedStyle(document.body);
    const h1Style = h1 ? window.getComputedStyle(h1) : undefined;
    const leadStyle = lead ? window.getComputedStyle(lead) : undefined;
    const linkStyle = footerLink ? window.getComputedStyle(footerLink) : undefined;
    const fixture = document.createElement("section");
    fixture.className = "qld__body";
    fixture.style.left = "-9999px";
    fixture.style.position = "absolute";
    fixture.style.top = "0";
    fixture.innerHTML = `
      <h2>Fixture h2</h2>
      <h3>Fixture h3</h3>
      <h4>Fixture h4</h4>
      <h5>Fixture h5</h5>
      <h6>Fixture h6</h6>
      <p class="qld__abstract">Fixture abstract</p>
    `;
    const paragraph = document.createElement("p");
    paragraph.textContent = "Fixture paragraph";
    fixture.append(paragraph);
    document.body.append(fixture);

    const fixtureStyles = Object.fromEntries(
      Array.from(fixture.querySelectorAll<HTMLElement>("h2,h3,h4,h5,h6")).map((element) => {
        const style = window.getComputedStyle(element);

        return [
          element.tagName.toLowerCase(),
          {
            fontFamily: style.fontFamily,
            fontSize: style.fontSize,
            fontWeight: style.fontWeight,
            lineHeight: style.lineHeight
          }
        ];
      })
    ) as Record<string, { fontFamily: string; fontSize: string; fontWeight: string; lineHeight: string }>;

    const abstract = fixture.querySelector<HTMLElement>(".qld__abstract");
    const abstractStyle = abstract ? window.getComputedStyle(abstract) : undefined;
    const paragraphStyle = paragraph ? window.getComputedStyle(paragraph) : undefined;
    const abstractFontFamily = abstractStyle?.fontFamily ?? "";
    const abstractFontSize = abstractStyle?.fontSize ?? "";
    const abstractLineHeight = abstractStyle?.lineHeight ?? "";
    const paragraphLineHeight = paragraphStyle?.lineHeight || paragraphStyle?.getPropertyValue("line-height") || "";
    const surfaceFixture = document.createElement("div");
    surfaceFixture.innerHTML = `
      <section class="qld__body qld__body--light"></section>
      <section class="qld__body qld__body--alt"></section>
      <section class="qld__body qld__body--dark"></section>
      <section class="qld__body qld__body--dark-alt"></section>
    `;
    document.body.append(surfaceFixture);

    const surfaceBackgrounds = {
      alt: window.getComputedStyle(surfaceFixture.querySelector<HTMLElement>(".qld__body--alt")!).backgroundColor,
      dark: window.getComputedStyle(surfaceFixture.querySelector<HTMLElement>(".qld__body--dark")!).backgroundColor,
      darkAlt: window.getComputedStyle(surfaceFixture.querySelector<HTMLElement>(".qld__body--dark-alt")!).backgroundColor,
      light: window.getComputedStyle(surfaceFixture.querySelector<HTMLElement>(".qld__body--light")!).backgroundColor
    };

    fixture.remove();
    surfaceFixture.remove();

    return {
      bodyBackground: bodyStyle.backgroundColor,
      bodyFontSize: bodyStyle.fontSize,
      bodyLineHeight: bodyStyle.lineHeight,
      colorScheme: rootStyle.getPropertyValue("--ssq-color-scheme").trim(),
      focusToken: rootStyle.getPropertyValue("--ssq-color-focus").trim(),
      hasQldHeadingToken: rootStyle.getPropertyValue("--QLD-color-light__heading").trim(),
      hasQldDarkHeadingToken: rootStyle.getPropertyValue("--QLD-color-dark__heading").trim(),
      h1FontFamily: h1Style?.fontFamily ?? "",
      h1Color: h1Style?.color ?? "",
      h1FontSize: h1Style?.fontSize ?? "",
      h1FontWeight: h1Style?.fontWeight ?? "",
      h1LetterSpacing: h1Style?.letterSpacing ?? "",
      h1LineHeight: h1Style?.lineHeight ?? "",
      fixtureStyles,
      abstractFontFamily,
      abstractFontSize,
      abstractLineHeight,
      leadFontSize: leadStyle?.fontSize ?? "",
      leadLineHeight: leadStyle?.lineHeight ?? "",
      linkDecorationLine: linkStyle?.textDecorationLine ?? "",
      linkDecorationThickness: linkStyle?.textDecorationThickness ?? "",
      linkUnderlineOffset: linkStyle?.textUnderlineOffset ?? "",
      paragraphLineHeight,
      surfaceBackgrounds,
      rootFontFamily: rootStyle.fontFamily
    };
  });

  const h1FontSize = Number.parseFloat(themeState.h1FontSize);
  const expectedH1Size = viewportWidth >= 992 ? 48 : 32;
  const expectedH1LineHeight = viewportWidth >= 992 ? 60 : 40;
  const expectedHeadingStyles = viewportWidth >= 992
    ? {
        h2: { fontSize: "32px", lineHeight: "40px" },
        h3: { fontSize: "24px", lineHeight: "32px" },
        h4: { fontSize: "20px", lineHeight: "24px" },
        h5: { fontSize: "16px", lineHeight: "20px" },
        h6: { fontSize: "14px", lineHeight: "16px" }
      }
    : {
        h2: { fontSize: "28px", lineHeight: "36px" },
        h3: { fontSize: "24px", lineHeight: "32px" },
        h4: { fontSize: "20px", lineHeight: "24px" },
        h5: { fontSize: "16px", lineHeight: "20px" },
        h6: { fontSize: "14px", lineHeight: "16px" }
      };
  const expectedLeadSize = viewportWidth >= 992 ? 24 : 20;
  const expectedLeadLineHeight = expectedLeadSize * 1.5;

  expect(themeState.colorScheme).toBe("dark");
  expect(themeState.hasQldHeadingToken).toBe("#000053");
  expect(["#fff", "#ffffff"]).toContain(themeState.hasQldDarkHeadingToken.toLowerCase());
  expect(themeState.rootFontFamily).toContain("Noto Sans");
  expect(themeState.h1FontFamily).toContain("Noto Sans");
  expect(h1FontSize).toBeGreaterThanOrEqual(expectedH1Size - 0.1);
  expect(h1FontSize).toBeLessThanOrEqual(expectedH1Size + 0.1);
  expect(Number.parseFloat(themeState.h1LineHeight)).toBeGreaterThanOrEqual(expectedH1LineHeight - 0.1);
  expect(Number.parseFloat(themeState.h1LineHeight)).toBeLessThanOrEqual(expectedH1LineHeight + 0.1);
  expect(themeState.h1FontWeight).toBe("600");
  expect(["0px", "normal"]).toContain(themeState.h1LetterSpacing);
  expect(themeState.h1Color).toBe("rgb(255, 255, 255)");
  expect(themeState.bodyFontSize).toBe("16px");
  expect(themeState.bodyLineHeight).toBe("24px");
  expect(themeState.bodyBackground).toBe("rgb(0, 94, 184)");
  expect(themeState.focusToken).toBe("#c6ffff");
  expect(themeState.paragraphLineHeight).toBe("28px");
  expect(themeState.abstractFontFamily).toContain("Noto Sans");
  expect(Number.parseFloat(themeState.abstractFontSize)).toBeGreaterThanOrEqual(expectedLeadSize - 0.1);
  expect(Number.parseFloat(themeState.abstractFontSize)).toBeLessThanOrEqual(expectedLeadSize + 0.1);
  expect(Number.parseFloat(themeState.abstractLineHeight)).toBeGreaterThanOrEqual(expectedLeadLineHeight - 0.1);
  expect(Number.parseFloat(themeState.abstractLineHeight)).toBeLessThanOrEqual(expectedLeadLineHeight + 0.1);

  if (themeState.leadFontSize) {
    expect(Number.parseFloat(themeState.leadFontSize)).toBeGreaterThanOrEqual(expectedLeadSize - 0.1);
    expect(Number.parseFloat(themeState.leadFontSize)).toBeLessThanOrEqual(expectedLeadSize + 0.1);
    expect(Number.parseFloat(themeState.leadLineHeight)).toBeGreaterThanOrEqual(expectedLeadLineHeight - 0.1);
    expect(Number.parseFloat(themeState.leadLineHeight)).toBeLessThanOrEqual(expectedLeadLineHeight + 0.1);
  }

  for (const [heading, expected] of Object.entries(expectedHeadingStyles)) {
    expect(themeState.fixtureStyles[heading].fontFamily).toContain("Noto Sans");
    expect(themeState.fixtureStyles[heading].fontSize).toBe(expected.fontSize);
    expect(themeState.fixtureStyles[heading].fontWeight).toBe("600");
    expect(themeState.fixtureStyles[heading].lineHeight).toBe(expected.lineHeight);
  }

  expect(themeState.surfaceBackgrounds.light).toBe("rgb(230, 246, 255)");
  expect(themeState.surfaceBackgrounds.alt).toBe("rgb(227, 231, 234)");
  expect(themeState.surfaceBackgrounds.dark).toBe("rgb(0, 94, 184)");
  expect(themeState.surfaceBackgrounds.darkAlt).toBe("rgb(0, 29, 116)");
  expect(themeState.linkDecorationLine).toContain("underline");
  expect(Number.parseFloat(themeState.linkDecorationThickness)).toBeGreaterThanOrEqual(0.5);
  expect(Number.parseFloat(themeState.linkUnderlineOffset)).toBeGreaterThan(0);
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
        await page.emulateMedia({ colorScheme: "dark" });
        await page.goto(pageTarget.url);

        await expectSingleVisibleH1(page, pageTarget.heading);
        await expect(page.getByText(pageTarget.keyText)).toBeVisible();
        await expect(page.getByRole("main")).toBeVisible();
        await expectNoVisibleHorizontalOverflow(page);
        await expectQhdsGridFoundation(page, viewport.width);
        await expectQhdsThemeFoundation(page, viewport.width);
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
