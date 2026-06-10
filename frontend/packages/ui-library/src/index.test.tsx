import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import {
  PrototypePageShell,
  QhdsButton,
  QhdsCard,
  QhdsFooter,
  QhdsHeader,
  QhdsLayout,
  QhdsPageAlert
} from "./index";

describe("PrototypePageShell", () => {
  it("exports the shell component", () => {
    expect(PrototypePageShell).toBeTypeOf("function");
  });

  it("renders a heading, lead and shared landmark wrappers", () => {
    const html = renderToStaticMarkup(
      <PrototypePageShell lead="Use services online." title="Service dashboard">
        <p>Content</p>
      </PrototypePageShell>
    );

    expect(html).toContain("<header");
    expect(html).toContain("<main");
    expect(html).toContain("<footer");
    expect(html).toContain("Service dashboard");
    expect(html).toContain("Use services online.");
  });
});

describe("QHDS core wrappers", () => {
  it("renders layout, header and footer without Next.js dependencies", () => {
    const html = renderToStaticMarkup(
      <QhdsLayout
        footer={<QhdsFooter serviceName="Footer service" />}
        header={<QhdsHeader navItems={[{ href: "/status", label: "Status" }]} serviceName="Header service" />}
      >
        <p>Body</p>
      </QhdsLayout>
    );

    expect(html).toContain("Header service");
    expect(html).toContain('href="/status"');
    expect(html).toContain("Footer service");
  });

  it("renders card, alert and button variants", () => {
    const html = renderToStaticMarkup(
      <>
        <QhdsPageAlert heading="Saved" tone="success">
          <p>Your draft was saved.</p>
        </QhdsPageAlert>
        <QhdsCard action={<QhdsButton href="/start">Start</QhdsButton>} heading="Apply online">
          <p>Prepare your details.</p>
        </QhdsCard>
        <QhdsButton variant="secondary">Cancel</QhdsButton>
      </>
    );

    expect(html).toContain('role="status"');
    expect(html).toContain("ssq-page-alert--success");
    expect(html).toContain("Apply online");
    expect(html).toContain('href="/start"');
    expect(html).toContain("ssq-button--secondary");
  });
});
