import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { QhdsSelect } from "./QhdsSelect";

describe("QhdsSelect", () => {
  it("renders label association, wrapper, options and optional marker", () => {
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
    expect(html).toContain("qld__select");
    expect(html).toContain("qld__select-control");
    expect(html).toContain("qld__text-input--block");
    expect(html).toContain('<option value="qld">Queensland</option>');
    expect(html).toContain('<option disabled="" value="interstate">Interstate</option>');
    expect(html).toContain("optional");
  });

  it("renders a placeholder option when supplied", () => {
    const html = renderToStaticMarkup(
      <QhdsSelect
        id="support-type"
        label="Support type"
        options={[{ label: "Bond assistance", value: "bond" }]}
        placeholder="Please select"
        placeholderDisabled
        required
      />
    );

    expect(html).toContain('<option disabled="" value="">Please select</option>');
    expect(html).toContain('required=""');
  });

  it("passes child options through when children are provided", () => {
    const html = renderToStaticMarkup(
      <QhdsSelect id="child-select" label="Child select">
        <option value="child">Child option</option>
      </QhdsSelect>
    );

    expect(html).toContain('<option value="child">Child option</option>');
  });

  it("links hint, error and existing descriptions to the native control", () => {
    const html = renderToStaticMarkup(
      <QhdsSelect
        aria-describedby="external-help"
        error="Select a support type."
        hint="Choose the support pathway that applies."
        id="support-type"
        label="Support type"
        options={[{ label: "Bond assistance", value: "bond" }]}
      />
    );

    expect(html).toContain('aria-describedby="external-help support-type-hint support-type-error"');
    expect(html).toContain('aria-invalid="true"');
    expect(html).toContain('id="support-type-hint"');
    expect(html).toContain('id="support-type-error"');
    expect(html).toContain("qld__text-input--error");
    expect(html).toContain("qld__select-error");
  });

  it("supports QHDS width classes, disabled state and multiple selects", () => {
    const html = renderToStaticMarkup(
      <QhdsSelect disabled id="postcode-area" label="Postcode area" multiple width="half">
        <option value="4000">4000</option>
        <option value="4001">4001</option>
      </QhdsSelect>
    );

    expect(html).toContain("qld__field-width--half");
    expect(html).toContain("ssq-select-wrapper--half");
    expect(html).toContain("ssq-select-wrapper--multiple");
    expect(html).toContain('disabled=""');
    expect(html).toContain('multiple=""');
  });
});
