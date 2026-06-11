import { getSeniorsCardShellData } from "@ssq/services/server";
import {
  PrototypePageShell,
  QhdsButton,
  QhdsCard,
  QhdsCheckbox,
  QhdsRadioGroup,
  QhdsSelect,
  QhdsTextInput,
  QhdsPageAlert
} from "@ssq/ui-library";

export async function SeniorsCardHomeContainer() {
  const { app } = await getSeniorsCardShellData();

  return (
    <PrototypePageShell
      lead="Check eligibility and prepare a prototype Seniors Card application."
      title={app.label}
    >
      <QhdsPageAlert heading="Before you start">
        <p>The next workflow slice will connect this entry point to draft creation and form steps.</p>
      </QhdsPageAlert>
      <QhdsCard action={<QhdsButton href="/status">Check app status</QhdsButton>} heading="Application entry">
        <p>This shared card pattern will frame eligibility, evidence and review sections.</p>
      </QhdsCard>
      <QhdsCard heading="Eligibility preview">
        <QhdsTextInput
          hint="Use the name shown on your identity documents."
          label="Full name"
          name="fullName"
          readOnly
          required
          value="Avery Taylor"
        />
        <QhdsSelect
          defaultValue="qld"
          hint="This prototype keeps options local until the draft workflow is connected."
          label="Residential state"
          name="residentialState"
          options={[
            { label: "Queensland", value: "qld" },
            { label: "Other Australian state or territory", value: "other" }
          ]}
          required
        />
        <QhdsRadioGroup
          defaultValue="yes"
          hint="Eligibility questions will be validated by the backend in a later slice."
          legend="Are you 65 years or older?"
          name="ageEligible"
          options={[
            { label: "Yes", value: "yes" },
            { label: "No", value: "no" }
          ]}
          required
        />
        <QhdsCheckbox label="I understand this is a prototype preview." name="prototypeAcknowledgement" required />
      </QhdsCard>
    </PrototypePageShell>
  );
}
