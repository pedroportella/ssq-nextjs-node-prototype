import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import {
  PrototypePageShell,
  QhdsButton,
  QhdsCard,
  QhdsCheckbox,
  QhdsFooter,
  QhdsRadioGroup,
  QhdsSelect,
  QhdsTextarea,
  QhdsTextInput,
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

describe("QHDS form wrappers", () => {
  it("associates text inputs with labels, hints and errors", () => {
    const html = renderToStaticMarkup(
      <QhdsTextInput
        error="Enter your full name."
        hint="Use your legal name."
        id="full-name"
        label="Full name"
        name="fullName"
        required
      />
    );

    expect(html).toContain('for="full-name"');
    expect(html).toContain('id="full-name"');
    expect(html).toContain('id="full-name-hint"');
    expect(html).toContain('id="full-name-error"');
    expect(html).toContain('aria-describedby="full-name-hint full-name-error"');
    expect(html).toContain('aria-invalid="true"');
    expect(html).toContain("required");
    expect(html).toContain("Enter your full name.");
  });

  it("renders select and textarea optional states", () => {
    const html = renderToStaticMarkup(
      <>
        <QhdsSelect
          id="state"
          label="Residential state"
          optional
          options={[
            { label: "Queensland", value: "qld" },
            { disabled: true, label: "Interstate", value: "interstate" }
          ]}
        />
        <QhdsTextarea id="notes" label="Notes" optional />
      </>
    );

    expect(html).toContain('for="state"');
    expect(html).toContain('<option value="qld">Queensland</option>');
    expect(html).toContain('<option disabled="" value="interstate">Interstate</option>');
    expect(html).toContain('for="notes"');
    expect(html).toContain("optional");
  });

  it("renders checkbox disabled and invalid states", () => {
    const html = renderToStaticMarkup(
      <QhdsCheckbox disabled error="You must accept the declaration." id="declaration" label="I agree" required />
    );

    expect(html).toContain('type="checkbox"');
    expect(html).toContain('for="declaration"');
    expect(html).toContain("ssq-checkbox--disabled");
    expect(html).toContain("ssq-checkbox--invalid");
    expect(html).toContain('disabled=""');
    expect(html).toContain('aria-invalid="true"');
  });

  it("renders radio group options with label associations", () => {
    const html = renderToStaticMarkup(
      <QhdsRadioGroup
        defaultValue="yes"
        error="Select one option."
        hint="Choose the answer that applies."
        id="age-eligible"
        legend="Are you eligible?"
        name="ageEligible"
        options={[
          { hint: "You meet the age requirement.", label: "Yes", value: "yes" },
          { label: "No", value: "no" }
        ]}
        required
      />
    );

    expect(html).toContain("<fieldset");
    expect(html).toContain("<legend");
    expect(html).toContain('id="age-eligible-yes"');
    expect(html).toContain('for="age-eligible-yes"');
    expect(html).toContain('checked=""');
    expect(html).toContain('aria-describedby="age-eligible-hint age-eligible-error"');
    expect(html).toContain("Select one option.");
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
