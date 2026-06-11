import { getRentalSecuritySubsidyShellData } from "@ssq/services/server";
import {
  PrototypePageShell,
  QhdsButton,
  QhdsCard,
  QhdsCheckbox,
  QhdsRadioGroup,
  QhdsSelect,
  QhdsTextarea,
  QhdsTextInput,
  QhdsPageAlert
} from "@ssq/ui-library";

export async function RentalSecuritySubsidyHomeContainer() {
  const { app } = await getRentalSecuritySubsidyShellData();

  return (
    <PrototypePageShell
      lead="Prepare a prototype rental support application and track its progress."
      title={app.label}
    >
      <QhdsPageAlert heading="Rental support workflow">
        <p>The deeper subsidy journey will use these wrappers for application state and service messages.</p>
      </QhdsPageAlert>
      <QhdsCard action={<QhdsButton href="/status">Check app status</QhdsButton>} heading="Draft application">
        <p>This surface is ready for the later form-control and draft lifecycle frontend slices.</p>
      </QhdsCard>
      <QhdsCard heading="Rental details preview">
        <QhdsTextInput
          hint="Enter the suburb for the property related to this request."
          label="Rental suburb"
          name="rentalSuburb"
          readOnly
          required
          value="Mackay"
        />
        <QhdsSelect
          defaultValue="bond"
          label="Support type"
          name="supportType"
          options={[
            { label: "Bond assistance", value: "bond" },
            { label: "Rental security subsidy", value: "subsidy" }
          ]}
          required
        />
        <QhdsRadioGroup
          defaultValue="private-rental"
          legend="Housing situation"
          name="housingSituation"
          options={[
            { hint: "You rent from a private owner or real estate agent.", label: "Private rental", value: "private-rental" },
            { hint: "You are moving from crisis or supported accommodation.", label: "Supported accommodation", value: "supported-accommodation" }
          ]}
          required
        />
        <QhdsTextarea
          hint="Keep this brief. Detailed evidence upload comes later."
          label="Anything else we should know?"
          name="additionalDetails"
          optional
          readOnly
          value="Applicant is preparing documents for review."
        />
        <QhdsCheckbox disabled label="Evidence upload will be completed in a later step." name="evidenceDeferred" />
      </QhdsCard>
    </PrototypePageShell>
  );
}
