import { createPrototypeAppSummary } from "@ssq/services";
import { PrototypePageShell } from "@ssq/ui-library";

export function SeniorsCardHomeContainer() {
  const app = createPrototypeAppSummary("seniors-card");

  return (
    <PrototypePageShell title={app.label}>
      <p>Check eligibility and prepare a prototype Seniors Card application.</p>
    </PrototypePageShell>
  );
}
