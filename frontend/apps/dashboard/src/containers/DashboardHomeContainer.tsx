import { createPrototypeAppSummary } from "@ssq/services";
import { PrototypePageShell } from "@ssq/ui-library";

export function DashboardHomeContainer() {
  const app = createPrototypeAppSummary("dashboard");

  return (
    <PrototypePageShell title={app.label}>
      <p>Review digital transaction activity across the prototype services.</p>
    </PrototypePageShell>
  );
}
