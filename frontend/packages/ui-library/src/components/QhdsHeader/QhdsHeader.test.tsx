import { act } from "react";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import type { ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { QhdsHeader } from "./QhdsHeader";

const styles = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "QhdsHeader.scss"), "utf8");

let root: Root | undefined;
let container: HTMLDivElement | undefined;

function renderInteractive(element: ReactNode) {
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);

  act(() => {
    root?.render(element);
  });

  return container;
}

afterEach(() => {
  act(() => {
    root?.unmount();
  });
  container?.remove();
  root = undefined;
  container = undefined;
});

describe("QhdsHeader", () => {
  it("renders service name and primary navigation without Next.js dependencies", () => {
    const html = renderToStaticMarkup(
      <QhdsHeader navItems={[{ href: "/status", label: "Status" }]} serviceName="Header service" />
    );

    expect(html).toContain('class="qld__header ssq-header ssq-header--app"');
    expect(html).toContain('role="banner"');
    expect(html).toContain("qld__header__pre-header");
    expect(html).toContain("qld__header__main");
    expect(html).toContain('alt="Queensland Government"');
    expect(html).toContain("header-logo-qgov--brand.svg");
    expect(html).toContain("container-fluid");
    expect(html).toContain("row");
    expect(html).toContain("Header service");
    expect(html).toContain("Avery Taylor");
    expect(html).toContain("Logout");
    expect(html).toContain("QLD-icons.svg#profile");
    expect(html).toContain("QLD-icons.svg#log-out");
    expect(html).toContain('class="qld__icon ssq-header__cta-svg"');
    expect(html).toContain('href="/status"');
    expect(html).toContain('id="qld-header-main-nav"');
    expect(html).toContain('aria-label="Primary"');
  });

  it("renders the RBDM-style pre-header base link and optional CTA links", () => {
    const html = renderToStaticMarkup(
      <QhdsHeader
        actions={<button type="button">Account</button>}
        baseUrlHref="/queensland-government"
        baseUrlText="Queensland Government"
        ctaItems={[
          {
            href: "/help",
            icon: <svg focusable="false" />,
            label: "Help"
          }
        ]}
      />
    );

    expect(html).toContain('class="qld__header__pre-header-url ssq-header__pre-header-url"');
    expect(html).toContain('href="/queensland-government"');
    expect(html).toContain("Queensland Government");
    expect(html).toContain('class="qld__header__cta-wrapper ssq-header__actions"');
    expect(html).toContain('class="qld__header__cta-link ssq-header__cta-link"');
    expect(html).toContain('class="qld__header__cta-link-icon ssq-header__cta-link-icon"');
    expect(html).toContain('class="qld__header__cta-link-text ssq-header__cta-link-text"');
    expect(html).toContain("Avery Taylor");
    expect(html).toContain("Logout");
    expect(html).toContain('href="/help"');
    expect(html).toContain("Help");
    expect(html).toContain("Account");
  });

  it("can hide mocked account controls when a caller owns auth state", () => {
    const html = renderToStaticMarkup(<QhdsHeader showAccountControls={false} />);

    expect(html).not.toContain("qld__header__cta-wrapper");
    expect(html).not.toContain("Avery Taylor");
    expect(html).not.toContain("Logout");
    expect(html).not.toContain("QLD-icons.svg#profile");
    expect(html).not.toContain("QLD-icons.svg#log-out");
  });

  it("supports contained width mode without changing the default app-shell mode", () => {
    const html = renderToStaticMarkup(<QhdsHeader width="contained" />);

    expect(html).toContain('class="qld__header ssq-header ssq-header--contained"');
    expect(styles).toContain(".ssq-header--app .container-fluid");
    expect(styles).toContain("padding-left: 2rem");
    expect(styles).toContain(".ssq-header--contained .container-fluid");
    expect(styles).toContain("max-width: var(--qld-grid-container-max-width)");
    expect(styles).toContain("height: 1.25rem");
    expect(styles).toContain(".ssq-header__cta-svg");
    expect(styles).toContain("color: var(--QLD-color-dark__action--secondary)");
    expect(styles).toContain("fill: var(--QLD-color-dark__action--secondary)");
    expect(styles).toContain("color: var(--QLD-color-dark__action--secondary-hover)");
  });

  it("supports route-style navigation callbacks without importing a router", () => {
    const onNavigate = vi.fn();
    const element = renderInteractive(
      <QhdsHeader
        accountHref="/account"
        accountName="Morgan Lee"
        baseUrlHref="/qld"
        brandHref="/home"
        ctaItems={[{ href: "/support", label: "Support" }]}
        logoutHref="/logout"
        navItems={[{ href: "/status", label: "Status" }]}
        onNavigate={onNavigate}
      />
    );
    const links = Array.from(element.querySelectorAll<HTMLAnchorElement>("a"));

    for (const link of links) {
      const event = new MouseEvent("click", { bubbles: true, cancelable: true });

      act(() => {
        link.dispatchEvent(event);
      });

      expect(event.defaultPrevented).toBe(true);
    }

    expect(links.map((link) => link.getAttribute("href"))).toEqual([
      "/qld",
      "/account",
      "/logout",
      "/support",
      "/home",
      "/status"
    ]);
    expect(onNavigate).toHaveBeenNthCalledWith(1, "/qld");
    expect(onNavigate).toHaveBeenNthCalledWith(2, "/account");
    expect(onNavigate).toHaveBeenNthCalledWith(3, "/logout");
    expect(onNavigate).toHaveBeenNthCalledWith(4, "/support");
    expect(onNavigate).toHaveBeenNthCalledWith(5, "/home");
    expect(onNavigate).toHaveBeenNthCalledWith(6, "/status");
  });

  it("does not own layout skip links", () => {
    const html = renderToStaticMarkup(<QhdsHeader />);

    expect(html).not.toContain("qld__skip-link");
  });

  it("keeps header links readable after visited state is applied", () => {
    expect(styles).toContain("--ssq-color-link: var(--ssq-color-header-text)");
    expect(styles).toContain("--ssq-color-link-decoration: var(--ssq-color-header-text)");
    expect(styles).toContain("--ssq-color-link-visited: var(--ssq-color-header-text)");
  });
});
