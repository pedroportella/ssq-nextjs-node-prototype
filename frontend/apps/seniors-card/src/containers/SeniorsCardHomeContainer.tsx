import { getSeniorsCardShellData } from "@ssq/services/server";
import { PrototypePageShell } from "@ssq/ui-library";

export async function SeniorsCardHomeContainer() {
  const { app } = await getSeniorsCardShellData();

  return (
    <PrototypePageShell title={app.label}>
      <p>Check eligibility and prepare a prototype Seniors Card application.</p>
    </PrototypePageShell>
  );
}
