import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { QhdsSelect } from "./QhdsSelect";

describe("QhdsSelect", () => {
  it("renders label association, options and optional marker", () => {
    const html = renderToStaticMarkup(
      <QhdsSelect
        id="state"
        label="Residential state"
        optional
        options={[
          { label: "Queensland", value: "qld" },
          { disabled: true, label: "Interstate", value: "interstate" }
        ]}
      />
    );

    expect(html).toContain('for="state"');
    expect(html).toContain('<option value="qld">Queensland</option>');
    expect(html).toContain('<option disabled="" value="interstate">Interstate</option>');
    expect(html).toContain("optional");
  });
});
