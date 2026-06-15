import { expect, type Locator, type Page, test } from "@playwright/test";
import { isMockSmokeAppSelected, selectedMockSmokeAppNames, type MockSmokeAppName } from "./app-selection";

const forbiddenRequestPatterns = [/localhost:7001/, /127\.0\.0\.1:7001/, /backend:7001/, /\/graphql(?:\?|$)/];

type TestedColorScheme = "dark" | "light";

const viewports = [
  { height: 900, name: "desktop", width: 1440 },
  { height: 844, name: "mobile", width: 390 }
] as const;

const colorSchemes: { colorScheme: TestedColorScheme; name: string }[] = [
  { colorScheme: "light", name: "light" },
  { colorScheme: "dark", name: "dark" }
];

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
] as const satisfies readonly {
  app: MockSmokeAppName;
  heading: string;
  keyText: string;
  path: string;
  url: string;
}[];

const selectedPages = pages.filter((page) => selectedMockSmokeAppNames.includes(page.app));

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

    function hasContainedHorizontalScroller(element: HTMLElement) {
      let current = element.parentElement;

      while (current && current !== document.body) {
        const style = window.getComputedStyle(current);
        const rect = current.getBoundingClientRect();
        const allowsHorizontalScroll = style.overflowX === "auto" || style.overflowX === "scroll";
        const isContained = rect.left >= -1 && rect.right <= viewportWidth + 1;

        if (allowsHorizontalScroll && isContained && current.scrollWidth > current.clientWidth) {
          return true;
        }

        current = current.parentElement;
      }

      return false;
    }

    return elements
      .flatMap((element) => {
        if (!(element instanceof HTMLElement)) {
          return [];
        }

        const style = window.getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        const isVisible = rect.width > 0 && rect.height > 0 && style.display !== "none" && style.visibility !== "hidden";
        const overflows = rect.left < -1 || rect.right > viewportWidth + 1;

        return isVisible && overflows && !hasContainedHorizontalScroller(element)
          ? [`${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ""}.${Array.from(element.classList).join(".")}`]
          : [];
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
        .filter((column) => /\bcol-lg-(?:[1-9]|10|11)\b/.test(column.className))
        .map((column) => {
          const row = column.closest(".row");
          return {
            column: column.getBoundingClientRect().width,
            row: row?.getBoundingClientRect().width ?? 0
          };
        }),
      hasGridRoot: Boolean(document.querySelector(".qld__grid")),
      rowCount: rows.length,
      usesAppShellWidth: Boolean(document.querySelector(".ssq-layout--app"))
    };
  });
  const expectedContentMaxWidth = gridState.usesAppShellWidth ? viewportWidth : Math.min(viewportWidth, 1376);

  expect(gridState.hasGridRoot).toBe(true);
  expect(gridState.contentContainerWidths.length + gridState.headerContainerWidths.length).toBeGreaterThanOrEqual(1);
  expect(Math.max(...gridState.contentContainerWidths)).toBeLessThanOrEqual(expectedContentMaxWidth + 1);
  expect(Math.max(...gridState.headerContainerWidths)).toBeLessThanOrEqual(viewportWidth + 1);
  expect(gridState.rowCount).toBeGreaterThanOrEqual(1);
  expect(gridState.columnClassNames.some((className) => className.includes("col-xs-12"))).toBe(true);

  if (viewportWidth >= 992) {
    expect(gridState.columnClassNames.some((className) => /\bcol-lg-(?:[1-9]|1[0-2])\b/.test(className))).toBe(true);

    if (gridState.desktopColumnWidths.length > 0) {
      expect(gridState.desktopColumnWidths.some((widths) => widths.column > 0 && widths.column < widths.row)).toBe(true);
    }
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

async function expectLocatorHasVisibleFocus(locator: Locator) {
  await locator.focus();

  const focusState = await locator.evaluate((element) => {
    const style = window.getComputedStyle(element as HTMLElement);
    const outlineWidth = Number.parseFloat(style.outlineWidth);
    const hasOutline = style.outlineStyle !== "none" && outlineWidth > 0;

    return {
      hasVisibleFocus: hasOutline || style.boxShadow !== "none"
    };
  });

  expect(focusState).toMatchObject({ hasVisibleFocus: true });
}

interface RgbColor {
  b: number;
  g: number;
  r: number;
}

interface ContrastSample {
  background: string;
  foreground: string;
  label: string;
  minimum: number;
}

function parseRgbColor(value: string): RgbColor {
  const match = value.match(/rgba?\((\d+(?:\.\d+)?),\s*(\d+(?:\.\d+)?),\s*(\d+(?:\.\d+)?)(?:,\s*[\d.]+)?\)/);

  if (!match) {
    throw new Error(`Unable to parse RGB colour: ${value}`);
  }

  return {
    b: Number.parseFloat(match[3]),
    g: Number.parseFloat(match[2]),
    r: Number.parseFloat(match[1])
  };
}

function relativeLuminance({ b, g, r }: RgbColor) {
  const toLinear = (channel: number) => {
    const srgb = channel / 255;

    return srgb <= 0.03928 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
  };

  return (0.2126 * toLinear(r)) + (0.7152 * toLinear(g)) + (0.0722 * toLinear(b));
}

function contrastRatio(foreground: string, background: string) {
  const foregroundLuminance = relativeLuminance(parseRgbColor(foreground));
  const backgroundLuminance = relativeLuminance(parseRgbColor(background));
  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);

  return (lighter + 0.05) / (darker + 0.05);
}

function expectContrastSamplesToPass(samples: ContrastSample[]) {
  const failures = samples
    .map((sample) => ({
      ...sample,
      ratio: Number(contrastRatio(sample.foreground, sample.background).toFixed(2))
    }))
    .filter((sample) => sample.ratio < sample.minimum);

  expect(failures).toEqual([]);
}

async function expectQhdsContrastFoundation(page: Page) {
  const samples = await page.evaluate(() => {
    interface BrowserColor {
      a: number;
      b: number;
      g: number;
      r: number;
    }

    interface BrowserContrastSample {
      background: string;
      foreground: string;
      label: string;
      minimum: number;
    }

    function parseColor(value: string): BrowserColor {
      const match = value.match(/rgba?\((\d+(?:\.\d+)?),\s*(\d+(?:\.\d+)?),\s*(\d+(?:\.\d+)?)(?:,\s*(\d?(?:\.\d+)?))?\)/);

      if (!match) {
        return { a: 1, b: 255, g: 255, r: 255 };
      }

      return {
        a: match[4] === undefined ? 1 : Number.parseFloat(match[4]),
        b: Number.parseFloat(match[3]),
        g: Number.parseFloat(match[2]),
        r: Number.parseFloat(match[1])
      };
    }

    function blend(foreground: BrowserColor, background: BrowserColor): BrowserColor {
      const alpha = foreground.a + (background.a * (1 - foreground.a));

      if (alpha === 0) {
        return { a: 0, b: 0, g: 0, r: 0 };
      }

      return {
        a: alpha,
        b: ((foreground.b * foreground.a) + (background.b * background.a * (1 - foreground.a))) / alpha,
        g: ((foreground.g * foreground.a) + (background.g * background.a * (1 - foreground.a))) / alpha,
        r: ((foreground.r * foreground.a) + (background.r * background.a * (1 - foreground.a))) / alpha
      };
    }

    function toRgbString(color: BrowserColor) {
      return `rgb(${Math.round(color.r)}, ${Math.round(color.g)}, ${Math.round(color.b)})`;
    }

    function effectiveBackground(element: HTMLElement) {
      let background: BrowserColor = { a: 1, b: 255, g: 255, r: 255 };
      const chain: HTMLElement[] = [];
      let current: HTMLElement | null = element;

      while (current) {
        chain.push(current);
        current = current.parentElement;
      }

      for (const item of chain.reverse()) {
        const color = parseColor(window.getComputedStyle(item).backgroundColor);

        if (color.a > 0) {
          background = blend(color, background);
        }
      }

      return background;
    }

    function hasVisibleBox(element: HTMLElement) {
      const style = window.getComputedStyle(element);
      const rect = element.getBoundingClientRect();

      return rect.width > 0 && rect.height > 0 && style.display !== "none" && style.visibility !== "hidden";
    }

    function sampleElement(element: HTMLElement, label: string, minimum = 4.5): BrowserContrastSample {
      const style = window.getComputedStyle(element);

      return {
        background: toRgbString(effectiveBackground(element)),
        foreground: toRgbString(parseColor(style.color)),
        label,
        minimum
      };
    }

    function createContrastFixture() {
      const fixture = document.createElement("div");
      fixture.setAttribute("data-ssq-contrast-fixture", "true");
      fixture.style.left = "-10000px";
      fixture.style.position = "absolute";
      fixture.style.top = "0";
      fixture.style.width = "640px";

      fixture.innerHTML = ["light", "alt", "dark", "dark-alt"].map((surface) => `
        <section class="qld__body qld__body--${surface}">
          <h2 data-contrast-sample="${surface} heading">Contrast heading</h2>
          <p data-contrast-sample="${surface} body">Contrast body text with enough length to inherit the active surface colour.</p>
          <a data-contrast-sample="${surface} link" href="#${surface}-link">Contrast link</a>
          <span data-contrast-sample="${surface} muted text" style="color: var(--ssq-color-muted)">Muted text</span>
          <span data-contrast-sample="${surface} visited link" style="color: var(--ssq-color-link-visited)">Visited link</span>
          <span data-contrast-sample="${surface} primary action" style="background: var(--ssq-color-action); color: var(--ssq-color-action-text); display: inline-block; padding: 0.5rem">Primary action</span>
          <span data-contrast-sample="${surface} secondary action" style="background: var(--ssq-color-surface); color: var(--ssq-color-action); display: inline-block; padding: 0.5rem">Secondary action</span>
          <span data-contrast-min="3" data-contrast-sample="${surface} focus indicator" style="color: var(--ssq-color-focus)">Focus indicator</span>
          <span data-contrast-sample="${surface} error text" style="color: var(--ssq-color-error)">Error text</span>
          <span data-contrast-min="3" data-contrast-sample="${surface} info border" style="background: var(--ssq-color-info-background); color: var(--ssq-color-info-border); display: inline-block; padding: 0.5rem">Info border</span>
          <span data-contrast-min="3" data-contrast-sample="${surface} success border" style="background: var(--ssq-color-success-background); color: var(--ssq-color-success-border); display: inline-block; padding: 0.5rem">Success border</span>
          <span data-contrast-min="3" data-contrast-sample="${surface} warning border" style="background: var(--ssq-color-warning-background); color: var(--ssq-color-warning-border); display: inline-block; padding: 0.5rem">Warning border</span>
          <span data-contrast-min="3" data-contrast-sample="${surface} error border" style="background: var(--ssq-color-error-background); color: var(--ssq-color-error-border); display: inline-block; padding: 0.5rem">Error border</span>
        </section>
      `).join("");

      document.body.append(fixture);

      return fixture;
    }

    const fixture = createContrastFixture();
    const selector = [
      "body",
      "main",
      "h1",
      "h2",
      "h3",
      "p",
      "li",
      "legend",
      "label",
      "a",
      ".ssq-button",
      ".ssq-card",
      ".ssq-card__heading",
      ".ssq-page-alert",
      ".ssq-page-alert__heading",
      ".ssq-page-header__context",
      ".ssq-page-header__lead",
      ".ssq-content-section__lead",
      ".ssq-summary-list__term",
      ".ssq-summary-list__description",
      ".ssq-form-field__hint",
      ".ssq-form-field__error",
      ".ssq-radio__hint",
      ".ssq-checkbox__label",
      ".ssq-file-upload__hint",
      ".ssq-file-upload__meta",
      ".ssq-file-upload__message",
      ".ssq-file-upload__error",
      ".ssq-file-upload__file-name",
      ".ssq-file-upload__status",
      ".ssq-input",
      ".ssq-select",
      ".ssq-textarea",
      ".ssq-progress__marker",
      ".ssq-progress__label",
      ".ssq-progress__description",
      ".ssq-table caption",
      ".ssq-table th",
      ".ssq-table td",
      "[data-contrast-sample]"
    ].join(",");
    const seen = new Set<HTMLElement>();
    const samples: BrowserContrastSample[] = [];

    for (const element of Array.from(document.querySelectorAll<HTMLElement>(selector))) {
      if (seen.has(element) || !hasVisibleBox(element)) {
        continue;
      }

      const text = element.innerText || element.getAttribute("aria-label") || element.getAttribute("value") || "";
      const sampleLabel = element.getAttribute("data-contrast-sample")
        ?? `${element.tagName.toLowerCase()}${element.className ? `.${String(element.className).trim().replace(/\s+/g, ".")}` : ""} ${text.trim().slice(0, 48)}`;
      const minimum = Number.parseFloat(element.getAttribute("data-contrast-min") ?? "4.5");

      if (text.trim() || element.matches("body, main, input, select, textarea, [data-contrast-sample]")) {
        samples.push(sampleElement(element, sampleLabel, minimum));
        seen.add(element);
      }
    }

    fixture.remove();

    return samples;
  });

  expectContrastSamplesToPass(samples);
}

async function expectQhdsComponentHooks(page: Page, path: string) {
  const componentState = await page.evaluate(() => ({
    alertCount: document.querySelectorAll(".qld__page-alerts").length,
    buttonCount: document.querySelectorAll(".qld__btn").length,
    cardCount: document.querySelectorAll(".qld__card").length,
    contentSectionCount: document.querySelectorAll(".ssq-content-section").length,
    directionLinkCount: document.querySelectorAll(".qld__direction-link").length,
    pageHeaderCount: document.querySelectorAll(".ssq-page-header").length,
    progressCount: document.querySelectorAll(".qld__progress-indicator").length,
    summaryListCount: document.querySelectorAll(".qld__summary-list").length,
    tableCount: document.querySelectorAll(".qld__table").length
  }));

  expect(componentState.buttonCount).toBeGreaterThan(0);

  if (path === "/apply") {
    expect(componentState.cardCount).toBeGreaterThan(0);
    expect(componentState.directionLinkCount).toBeGreaterThan(0);
    expect(componentState.progressCount).toBeGreaterThan(0);
  } else {
    expect(componentState.contentSectionCount).toBeGreaterThan(0);
    expect(componentState.pageHeaderCount).toBeGreaterThan(0);
    expect(componentState.summaryListCount).toBeGreaterThan(0);
  }

  if (path === "/") {
    expect(componentState.cardCount).toBeGreaterThan(0);
  }

  if (path === "/application-status") {
    expect(componentState.alertCount).toBeGreaterThan(0);
    expect(componentState.tableCount).toBeGreaterThan(0);
  }
}

async function expectQhdsThemeFoundation(page: Page, viewportWidth: number, colorScheme: TestedColorScheme) {
  const themeState = await page.evaluate(() => {
    const h1 = document.querySelector("h1");
    const lead = document.querySelector<HTMLElement>('[class*="lead"]');
    const footerLink = document.querySelector<HTMLElement>(".qld__footer a");
    const header = document.querySelector<HTMLElement>(".ssq-header");
    const rootStyle = window.getComputedStyle(document.documentElement);
    const bodyStyle = window.getComputedStyle(document.body);
    const headerStyle = header ? window.getComputedStyle(header) : undefined;
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
      headerVisitedToken: headerStyle?.getPropertyValue("--ssq-color-link-visited").trim() ?? "",
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
      rootVisitedToken: rootStyle.getPropertyValue("--ssq-color-link-visited").trim(),
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

  expect(themeState.colorScheme).toBe(colorScheme);
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
  expect(themeState.h1Color).toBe(colorScheme === "dark" ? "rgb(255, 255, 255)" : "rgb(0, 0, 83)");
  expect(themeState.bodyFontSize).toBe("16px");
  expect(themeState.bodyLineHeight).toBe("24px");
  expect(themeState.bodyBackground).toBe(colorScheme === "dark" ? "rgb(0, 0, 83)" : "rgb(255, 255, 255)");
  expect(themeState.focusToken).toBe(colorScheme === "dark" ? "#c6ffff" : "#002e85");
  if (colorScheme === "dark") {
    expect(["#fff", "#ffffff"]).toContain(themeState.rootVisitedToken);
  } else {
    expect(themeState.rootVisitedToken).toBe("#551a8b");
  }
  expect(["#fff", "#ffffff"]).toContain(themeState.headerVisitedToken);
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
  for (const scheme of colorSchemes) {
    test.describe(`frontend visual/accessibility QA - ${viewport.name} ${scheme.name}`, () => {
      for (const pageTarget of selectedPages) {
        test(`${pageTarget.app}${pageTarget.path} has landmarks, readable layout, contrast and no backend requests`, async ({ page }) => {
          const forbiddenRequests = trackForbiddenRequests(page);

          await page.setViewportSize({ height: viewport.height, width: viewport.width });
          await page.emulateMedia({ colorScheme: scheme.colorScheme });
          await page.goto(pageTarget.url);

          await expectSingleVisibleH1(page, pageTarget.heading);
          await expect(page.getByText(pageTarget.keyText)).toBeVisible();
          await expect(page.getByRole("main")).toBeVisible();
          await expectNoVisibleHorizontalOverflow(page);
          await expectQhdsGridFoundation(page, viewport.width);
          await expectQhdsComponentHooks(page, pageTarget.path);
          await expectQhdsThemeFoundation(page, viewport.width, scheme.colorScheme);
          await expectQhdsContrastFoundation(page);
          await expectFocusedElementHasVisibleFocus(page);
          expect(forbiddenRequests).toEqual([]);
        });
      }
    });
  }
}

if (isMockSmokeAppSelected("seniors-card")) {
  test("seniors-card transaction form validation states are accessible in mock mode", async ({ page }) => {
    const forbiddenRequests = trackForbiddenRequests(page);

    await page.setViewportSize({ height: 844, width: 390 });
    await page.goto("http://localhost:3001/apply");
    await expect(page.locator("form.qld__form")).toBeVisible();
    const dateOfBirth = page.getByLabel("Date of birth");
    await expect(dateOfBirth).toHaveAttribute("aria-invalid", "true");
    await expect(dateOfBirth).toHaveAttribute("aria-describedby", "date-of-birth-hint date-of-birth-error");
    await expect(dateOfBirth).toHaveClass(/qld__text-input--error/);
    await expect(page.locator("#date-of-birth-error")).toHaveText("Enter a date of birth that confirms eligibility.");
    await expect(page.getByText("Enter a date of birth that confirms eligibility.")).toBeVisible();
    await expect(dateOfBirth).toBeVisible();
    await expectLocatorHasVisibleFocus(dateOfBirth);
    await expectNoVisibleHorizontalOverflow(page);

    expect(forbiddenRequests).toEqual([]);
  });

  test("seniors-card status page exposes upload and download controls with accessible names", async ({ page }) => {
    const forbiddenRequests = trackForbiddenRequests(page);

    await page.goto("http://localhost:3001/application-status");
    await expect(page.getByRole("link", { name: "Download submission summary" })).toBeVisible();
    await expect(page.getByLabel("Upload supporting documents")).toHaveAttribute("type", "file");
    await expect(page.getByText("identity-archive.zip")).toBeVisible();

    expect(forbiddenRequests).toEqual([]);
  });
}

if (isMockSmokeAppSelected("rental-security-subsidy")) {
  test("rental-security-subsidy transaction form validation states are accessible in mock mode", async ({ page }) => {
    const forbiddenRequests = trackForbiddenRequests(page);

    await page.setViewportSize({ height: 844, width: 390 });
    await page.goto("http://localhost:3002/apply");
    await expect(page.locator("form.qld__form")).toBeVisible();
    const weeklyRent = page.getByLabel("Weekly rent");
    await expect(weeklyRent).toHaveAttribute("aria-invalid", "true");
    await expect(weeklyRent).toHaveAttribute("aria-describedby", "weekly-rent-hint weekly-rent-error");
    await expect(weeklyRent).toHaveClass(/qld__text-input--error/);
    await expect(page.locator("#weekly-rent-error")).toHaveText("Enter the weekly rent amount for the property.");
    await expect(page.getByText("Enter the weekly rent amount for the property.")).toBeVisible();
    await expect(weeklyRent).toBeVisible();
    await expectLocatorHasVisibleFocus(weeklyRent);
    await expectNoVisibleHorizontalOverflow(page);

    expect(forbiddenRequests).toEqual([]);
  });

  test("rental-security-subsidy status page exposes upload and download controls with accessible names", async ({ page }) => {
    const forbiddenRequests = trackForbiddenRequests(page);

    await page.goto("http://localhost:3002/application-status");
    await expect(page.getByRole("link", { name: "Download submission summary" })).toBeVisible();
    await expect(page.getByLabel("Upload supporting documents")).toHaveAttribute("type", "file");
    await expect(page.getByText("rental-property-archive.zip")).toBeVisible();

    expect(forbiddenRequests).toEqual([]);
  });
}
