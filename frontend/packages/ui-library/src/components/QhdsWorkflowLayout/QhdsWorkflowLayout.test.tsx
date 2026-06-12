import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { QhdsWorkflowLayout } from "./QhdsWorkflowLayout";

describe("QhdsWorkflowLayout", () => {
  it("renders workflow progress, page heading, content and actions in stable regions", () => {
    const html = renderToStaticMarkup(
      <QhdsWorkflowLayout
        actions={<button type="button">Continue</button>}
        backLink={<a href="/">Back</a>}
        contextLabel="Seniors Card"
        heading="Check your eligibility"
        lead="Answer these questions before applying."
        progress={<ol><li>Eligibility</li></ol>}
        requiredText="All fields are required unless marked optional."
      >
        <p>Question content</p>
      </QhdsWorkflowLayout>
    );

    expect(html).toContain('aria-label="Form progress"');
    expect(html).toContain("<h1");
    expect(html).toContain("Check your eligibility");
    expect(html).toContain("Question content");
    expect(html).toContain("Continue");
  });
});
