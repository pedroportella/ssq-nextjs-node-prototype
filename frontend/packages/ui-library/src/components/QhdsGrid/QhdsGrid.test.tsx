import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { QhdsCol, QhdsContainer, QhdsRow } from "./QhdsGrid";

describe("QhdsGrid", () => {
  it("renders QHDS-compatible container, row and column classes", () => {
    const html = renderToStaticMarkup(
      <QhdsContainer>
        <QhdsRow>
          <QhdsCol lg={8} md={6} sm={12} xl={9}>
            Main content
          </QhdsCol>
        </QhdsRow>
      </QhdsContainer>
    );

    expect(html).toContain('class="container-fluid"');
    expect(html).toContain('class="row"');
    expect(html).toContain("col-xs-12 col-sm-12 col-md-6 col-lg-8 col-xl-9");
  });

  it("can render a fixed container", () => {
    const html = renderToStaticMarkup(<QhdsContainer fluid={false}>Content</QhdsContainer>);

    expect(html).toContain('class="container"');
  });
});
