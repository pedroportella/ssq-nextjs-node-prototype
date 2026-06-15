import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { QhdsWorkflowLayout } from "./QhdsWorkflowLayout";

const styles = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "QhdsWorkflowLayout.scss"), "utf8");

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

    expect(html).toContain("ssq-workflow-layout--with-progress");
    expect(html).toContain('aria-label="Form progress"');
    expect(html).toContain("<h1");
    expect(html).toContain("Check your eligibility");
    expect(html).toContain("Question content");
    expect(html).toContain("Continue");
    expect(styles).toContain("--ssq-workflow-page-width: 76rem");
    expect(styles).toContain("--ssq-workflow-progress-width: 17.875rem");
    expect(styles).toContain("--ssq-workflow-content-width: 50.167rem");
    expect(styles).toContain("--ssq-workflow-wide-column-gap: 8rem");
    expect(styles).toContain("grid-template-columns: minmax(14rem, var(--ssq-workflow-progress-width)) minmax(0, 1fr)");
  });
});
