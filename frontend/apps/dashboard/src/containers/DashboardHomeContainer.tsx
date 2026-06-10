import { getDashboardShellData } from "@ssq/services/server";
import { PrototypePageShell, QhdsButton, QhdsCard, QhdsPageAlert } from "@ssq/ui-library";

export async function DashboardHomeContainer() {
  const { app } = await getDashboardShellData();

  return (
    <PrototypePageShell
      lead="Review digital transaction activity across the prototype services."
      title={app.label}
    >
      <QhdsPageAlert heading="Prototype platform status">
        <p>Backend-backed dashboard metrics will appear here as the GraphQL contracts are expanded.</p>
      </QhdsPageAlert>
      <QhdsCard action={<QhdsButton href="/status">Check app status</QhdsButton>} heading="Operations snapshot">
        <p>Use this dashboard surface to validate shared navigation, alerts, cards and action styling.</p>
      </QhdsCard>
    </PrototypePageShell>
  );
}
