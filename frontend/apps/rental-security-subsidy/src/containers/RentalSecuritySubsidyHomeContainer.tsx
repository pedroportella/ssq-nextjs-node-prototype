import { getRentalSecuritySubsidyShellData } from "@ssq/services/server";
import {
  QhdsButton,
  QhdsCard,
  QhdsCheckbox,
  QhdsFooter,
  QhdsHeader,
  QhdsLayout,
  QhdsRadioGroup,
  QhdsSelect,
  QhdsTextarea,
  QhdsTextInput,
  QhdsPageAlert
} from "@ssq/ui-library";

import styles from "./RentalSecuritySubsidyHomeContainer.module.scss";

export async function RentalSecuritySubsidyHomeContainer() {
  const { app } = await getRentalSecuritySubsidyShellData();

  return (
    <QhdsLayout footer={<QhdsFooter />} header={<QhdsHeader />}>
      <section aria-labelledby="page-title" className={styles.inner}>
        <h1 className={styles.title} id="page-title">
          {app.label}
        </h1>
        <p className={styles.lead}>Prepare a prototype rental support application and track its progress.</p>
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
      </section>
    </QhdsLayout>
  );
}
