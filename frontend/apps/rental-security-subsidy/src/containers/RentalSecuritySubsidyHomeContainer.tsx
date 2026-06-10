import { getRentalSecuritySubsidyShellData } from "@ssq/services/server";
import { PrototypePageShell, QhdsButton, QhdsCard, QhdsPageAlert } from "@ssq/ui-library";

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
    </PrototypePageShell>
  );
}
