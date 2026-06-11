import { getDashboardShellData } from "@ssq/services/server";
import { QhdsButton, QhdsCard, QhdsFooter, QhdsHeader, QhdsLayout, QhdsPageAlert } from "@ssq/ui-library";

import styles from "./DashboardHomeContainer.module.scss";

export async function DashboardHomeContainer() {
  const { app } = await getDashboardShellData();

  return (
    <QhdsLayout footer={<QhdsFooter />} header={<QhdsHeader />}>
      <main className={styles.page}>
        <section aria-labelledby="page-title" className={styles.inner}>
          <h1 className={styles.title} id="page-title">
            {app.label}
          </h1>
          <p className={styles.lead}>Review digital transaction activity across the prototype services.</p>
          <QhdsPageAlert heading="Prototype platform status">
            <p>Backend-backed dashboard metrics will appear here as the GraphQL contracts are expanded.</p>
          </QhdsPageAlert>
          <QhdsCard action={<QhdsButton href="/status">Check app status</QhdsButton>} heading="Operations snapshot">
            <p>Use this dashboard surface to validate shared navigation, alerts, cards and action styling.</p>
          </QhdsCard>
        </section>
      </main>
    </QhdsLayout>
  );
}
