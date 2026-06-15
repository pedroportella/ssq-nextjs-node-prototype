import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { getQhdsIconReference, QhdsIcon } from "./QhdsIcon";

describe("QhdsIcon", () => {
  it("renders decorative QLD sprite icons by default", () => {
    const html = renderToStaticMarkup(<QhdsIcon className="ssq-header__cta-svg" symbol="profile" />);

    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('class="qld__icon ssq-header__cta-svg"');
    expect(html).toContain('focusable="false"');
    expect(html).toContain("QLD-icons.svg#profile");
  });

  it("supports accessible icon labels", () => {
    const html = renderToStaticMarkup(<QhdsIcon label="Profile" symbol="profile" />);

    expect(html).toContain('role="img"');
    expect(html).toContain('aria-label="Profile"');
    expect(html).not.toContain("aria-hidden");
  });

  it("maps QHDS extended icon ids to the health sprite", () => {
    const href = getQhdsIconReference({ symbol: "extended_health_alert" });
    const html = renderToStaticMarkup(<QhdsIcon symbol="extended_health_alert" />);

    expect(href).toContain("QLD-Health-icons.svg#health_alert");
    expect(html).toContain("QLD-Health-icons.svg#health_alert");
    expect(html).not.toContain("#extended_health_alert");
  });

  it("can explicitly render a health sprite symbol", () => {
    const html = renderToStaticMarkup(<QhdsIcon sprite="qld-health" symbol="health_alert" />);

    expect(html).toContain("QLD-Health-icons.svg#health_alert");
  });

  it("can render QHDS utility sprite icons with size hooks", () => {
    const html = renderToStaticMarkup(<QhdsIcon size="sm" sprite="utility" symbol="qld__icon__search" />);

    expect(html).toContain('class="qld__icon qld__icon--sm"');
    expect(html).toContain("svg-icons.svg#qld__icon__search");
  });
});
