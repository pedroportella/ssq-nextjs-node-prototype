import { getSeniorsCardShellData } from "@ssq/services/server";
import { PrototypePageShell, QhdsButton, QhdsCard, QhdsPageAlert } from "@ssq/ui-library";

export async function SeniorsCardHomeContainer() {
  const { app } = await getSeniorsCardShellData();

  return (
    <PrototypePageShell
      lead="Check eligibility and prepare a prototype Seniors Card application."
      title={app.label}
    >
      <QhdsPageAlert heading="Before you start">
        <p>The next workflow slice will connect this entry point to draft creation and form steps.</p>
      </QhdsPageAlert>
      <QhdsCard action={<QhdsButton href="/status">Check app status</QhdsButton>} heading="Application entry">
        <p>This shared card pattern will frame eligibility, evidence and review sections.</p>
      </QhdsCard>
    </PrototypePageShell>
  );
}
