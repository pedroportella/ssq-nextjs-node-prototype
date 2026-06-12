import { getSeniorsCardShellData, getSeniorsCardWorkflowData } from "@ssq/services/server";
import { QhdsButton, QhdsCard, QhdsFooter, QhdsHeader, QhdsLayout, QhdsPageAlert } from "@ssq/ui-library";

import styles from "./SeniorsCardHomeContainer.module.scss";

import type { AppShellData } from "@ssq/services/server";
import type { PrototypeWorkflowData } from "@ssq/services";

export function SeniorsCardOverviewContent({ shell, workflow }: { shell: AppShellData; workflow: PrototypeWorkflowData }) {
  return (
    <QhdsLayout footer={<QhdsFooter />} header={<QhdsHeader />}>
      <section aria-labelledby="page-title" className={styles.inner}>
        <div className={styles.hero}>
          <div>
            <h1 className={styles.title} id="page-title">
              {shell.app.label}
            </h1>
            <p className={styles.lead}>Check eligibility and prepare a prototype Seniors Card application.</p>
          </div>
          <div className={styles.profileSummary} aria-label="Profile summary">
            <p className={styles.eyebrow}>Applicant</p>
            <p className={styles.profileName}>{workflow.profile.displayName}</p>
            <p className={styles.meta}>{workflow.profile.email}</p>
          </div>
        </div>

        <QhdsPageAlert heading="Frontend-only workflow" tone="success">
          <p>
            This Seniors Card journey is using {shell.dataSource} data from the frontend service layer, including mock draft,
            validation and submission responses.
          </p>
        </QhdsPageAlert>

        <div className={styles.cardGrid}>
          <QhdsCard action={<QhdsButton href="/apply">Start application</QhdsButton>} heading="Apply for a Seniors Card">
            <p>Check your eligibility, review prefilled details and prepare a draft application.</p>
          </QhdsCard>
          <QhdsCard action={<QhdsButton href="/application-status" variant="secondary">View status</QhdsButton>} heading="Track your request">
            <p>
              View mock submission reference <strong>{workflow.submittedRequest.referenceNumber}</strong> and recent activity.
            </p>
          </QhdsCard>
          <QhdsCard heading="Saved draft">
            <p>
              Draft <strong>{workflow.draft.draftId}</strong> is ready to continue.
            </p>
            <p className={styles.meta}>Last updated {new Date(workflow.draft.lastUpdated).toLocaleString("en-AU")}</p>
          </QhdsCard>
        </div>
      </section>
    </QhdsLayout>
  );
}

export async function SeniorsCardOverviewContainer() {
  const [shell, workflow] = await Promise.all([getSeniorsCardShellData(), getSeniorsCardWorkflowData()]);

  return <SeniorsCardOverviewContent shell={shell} workflow={workflow} />;
}
