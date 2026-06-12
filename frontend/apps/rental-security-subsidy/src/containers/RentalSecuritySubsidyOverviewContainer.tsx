import { getRentalSecuritySubsidyShellData, getRentalSecuritySubsidyWorkflowData } from "@ssq/services/server";
import { QhdsButton, QhdsCard, QhdsFooter, QhdsHeader, QhdsLayout, QhdsPageAlert } from "@ssq/ui-library";

import styles from "./RentalSecuritySubsidyHomeContainer.module.scss";

import type { PrototypeWorkflowData } from "@ssq/services";
import type { AppShellData } from "@ssq/services/server";

export function RentalSecuritySubsidyOverviewContent({
  shell,
  workflow
}: {
  shell: AppShellData;
  workflow: PrototypeWorkflowData;
}) {
  return (
    <QhdsLayout footer={<QhdsFooter />} header={<QhdsHeader />}>
      <section aria-labelledby="page-title" className={styles.inner}>
        <div className={styles.hero}>
          <div>
            <h1 className={styles.title} id="page-title">
              {shell.app.label}
            </h1>
            <p className={styles.lead}>Prepare a prototype rental support application and track its progress.</p>
          </div>
          <div className={styles.profileSummary} aria-label="Profile summary">
            <p className={styles.eyebrow}>Applicant</p>
            <p className={styles.profileName}>{workflow.profile.displayName}</p>
            <p className={styles.meta}>{workflow.profile.email}</p>
          </div>
        </div>

        <QhdsPageAlert heading="Frontend-only rental workflow" tone="success">
          <p>
            This rental support journey is using {shell.dataSource} data from the frontend service layer, including mock draft,
            validation and submission responses.
          </p>
        </QhdsPageAlert>

        <div className={styles.cardGrid}>
          <QhdsCard action={<QhdsButton href="/apply">Start application</QhdsButton>} heading="Apply for rental support">
            <p>Complete a multi-step prototype workflow covering household, income and rental property details.</p>
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

export async function RentalSecuritySubsidyOverviewContainer() {
  const [shell, workflow] = await Promise.all([
    getRentalSecuritySubsidyShellData(),
    getRentalSecuritySubsidyWorkflowData()
  ]);

  return <RentalSecuritySubsidyOverviewContent shell={shell} workflow={workflow} />;
}
