import { getSeniorsCardWorkflowData, submitTransactionDraft } from "@ssq/services/server";
import { QhdsButton, QhdsCard, QhdsFooter, QhdsHeader, QhdsLayout, QhdsPageAlert } from "@ssq/ui-library";

import styles from "./SeniorsCardHomeContainer.module.scss";

import type { PrototypeSubmitResult, PrototypeWorkflowData } from "@ssq/services";

function formatStatus(status: string): string {
  return status
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function SeniorsCardStatusContent({
  submitResult,
  workflow
}: {
  submitResult: PrototypeSubmitResult;
  workflow: PrototypeWorkflowData;
}) {
  return (
    <QhdsLayout footer={<QhdsFooter />} header={<QhdsHeader />}>
      <section aria-labelledby="page-title" className={styles.inner}>
        <h1 className={styles.title} id="page-title">
          Seniors Card application status
        </h1>
        <p className={styles.lead}>Track the mock submission produced by the frontend-only workflow.</p>

        <QhdsPageAlert heading="Application submitted" tone="success">
          <p>
            Reference <strong>{submitResult.referenceNumber}</strong> is currently{" "}
            <strong>{formatStatus(submitResult.status)}</strong>.
          </p>
        </QhdsPageAlert>

        <div className={styles.cardGrid}>
          <QhdsCard action={<QhdsButton href="/apply">Review application</QhdsButton>} heading="Request summary">
            <p>
              Applicant: <strong>{workflow.profile.displayName}</strong>
            </p>
            <p>
              Summary file placeholder: <strong>{submitResult.summary.filename}</strong>
            </p>
          </QhdsCard>

          <QhdsCard heading="Recent activity">
            <ol className={styles.activityList}>
              {submitResult.activity.map((entry, index) => (
                <li className={styles.activityItem} key={`${entry.at}-${entry.description}-${index}`}>
                  <span className={styles.activityDescription}>{entry.description}</span>
                  <span className={styles.meta}>{formatStatus(entry.status)}</span>
                </li>
              ))}
            </ol>
          </QhdsCard>
        </div>
      </section>
    </QhdsLayout>
  );
}

export async function SeniorsCardStatusContainer() {
  const [workflow, submitResult] = await Promise.all([getSeniorsCardWorkflowData(), submitTransactionDraft("seniors-card")]);

  return <SeniorsCardStatusContent submitResult={submitResult} workflow={workflow} />;
}
