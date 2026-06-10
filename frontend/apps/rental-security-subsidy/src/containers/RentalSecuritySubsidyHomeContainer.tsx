import { createPrototypeAppSummary } from "@ssq/services";
import { PrototypePageShell } from "@ssq/ui-library";

export function RentalSecuritySubsidyHomeContainer() {
  const app = createPrototypeAppSummary("rental-security-subsidy");

  return (
    <PrototypePageShell title={app.label}>
      <p>Prepare a prototype rental support application and track its progress.</p>
    </PrototypePageShell>
  );
}
