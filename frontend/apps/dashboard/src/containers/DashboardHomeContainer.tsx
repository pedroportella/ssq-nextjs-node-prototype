import { getDashboardShellData } from "@ssq/services/server";
import { PrototypePageShell } from "@ssq/ui-library";

export async function DashboardHomeContainer() {
  const { app } = await getDashboardShellData();

  return (
    <PrototypePageShell title={app.label}>
      <p>Review digital transaction activity across the prototype services.</p>
    </PrototypePageShell>
  );
}
