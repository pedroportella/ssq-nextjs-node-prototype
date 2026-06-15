import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { QhdsFooter } from "./QhdsFooter";

const styles = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "QhdsFooter.scss"), "utf8");

describe("QhdsFooter", () => {
  it("renders app-width QHDS footer structure with the default contact action", () => {
    const html = renderToStaticMarkup(
      <QhdsFooter>
        <p>Review environment</p>
      </QhdsFooter>
    );

    expect(html).toContain('class="qld__footer qld__footer--dark-alt ssq-footer ssq-footer--app"');
    expect(html).toContain('role="contentinfo"');
    expect(html).toContain('class="container-fluid ssq-footer__container"');
    expect(html).toContain("qld__footer__row");
    expect(html).toContain("qld__footer__heading");
    expect(html).toContain("Contact Us");
    expect(html).toContain("For general enquiries, feedback, complaints and compliments:");
    expect(html).toContain('13 QGOV (<a href="tel:137468">13 74 68</a>)');
    expect(html).toContain('href="https://www.qld.gov.au/contact-us"');
    expect(html).toContain("Contact us");
    expect(html).toContain("qld__btn qld__btn--secondary");
    expect(html).toContain("Queensland Government acknowledges the Traditional Owners");
    expect(html).toContain("The State of Queensland 1995-2026");
    expect(html).toContain("Review environment");
  });

  it("supports contained width and a RBDM-style feedback action", () => {
    const html = renderToStaticMarkup(
      <QhdsFooter
        contactAction={{ href: "/feedback", label: "Feedback" }}
        links={[{ href: "/privacy", label: "Privacy" }]}
        width="contained"
      />
    );

    expect(html).toContain("ssq-footer--contained");
    expect(html).toContain('href="/feedback"');
    expect(html).toContain("Feedback");
    expect(html).toContain('href="/privacy"');
    expect(html).toContain("Privacy");
    expect(styles).toContain(".ssq-footer--app .ssq-footer__container");
    expect(styles).toContain("max-width: none");
    expect(styles).toContain("padding-left: 2rem");
    expect(styles).toContain(".ssq-footer--contained .ssq-footer__container");
    expect(styles).toContain("max-width: var(--qld-grid-container-max-width)");
  });

  it("can omit the footer contact action without removing contact details", () => {
    const html = renderToStaticMarkup(<QhdsFooter contactAction={null} />);

    expect(html).toContain("Contact Us");
    expect(html).toContain("13 QGOV");
    expect(html).not.toContain("qld__btn");
  });
});
