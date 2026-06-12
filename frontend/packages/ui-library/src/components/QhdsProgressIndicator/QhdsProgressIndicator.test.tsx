import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { QhdsProgressIndicator } from "./QhdsProgressIndicator";

describe("QhdsProgressIndicator", () => {
  it("renders current step semantics", () => {
    const html = renderToStaticMarkup(
      <QhdsProgressIndicator
        label="Application progress"
        steps={[
          { id: "about", label: "About you", status: "completed" },
          { description: "Current section", id: "contact", label: "Contact details", status: "current" },
          { id: "review", label: "Review", status: "upcoming" }
        ]}
      />
    );

    expect(html).toContain('aria-label="Application progress"');
    expect(html).toContain("ssq-progress__step--completed");
    expect(html).toContain('aria-current="step"');
    expect(html).toContain("Current section");
  });
});
