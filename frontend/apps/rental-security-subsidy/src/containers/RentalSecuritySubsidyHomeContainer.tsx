import { getRentalSecuritySubsidyShellData } from "@ssq/services/server";
import { PrototypePageShell } from "@ssq/ui-library";

export async function RentalSecuritySubsidyHomeContainer() {
  const { app } = await getRentalSecuritySubsidyShellData();

  return (
    <PrototypePageShell title={app.label}>
      <p>Prepare a prototype rental support application and track its progress.</p>
    </PrototypePageShell>
  );
}
