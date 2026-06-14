import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { QhdsButton } from "../QhdsButton";
import { QhdsCard } from "./QhdsCard";

describe("QhdsCard", () => {
  it("renders heading, content and optional action", () => {
    const html = renderToStaticMarkup(
      <QhdsCard action={<QhdsButton href="/start">Start</QhdsButton>} heading="Apply online">
        <p>Prepare your details.</p>
      </QhdsCard>
    );

    expect(html).toContain("<article");
    expect(html).toContain("qld__card");
    expect(html).toContain("qld__card__title");
    expect(html).toContain("qld__card__footer");
    expect(html).toContain("Apply online");
    expect(html).toContain("Prepare your details.");
    expect(html).toContain('href="/start"');
  });
});
