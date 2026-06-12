import {
  getRentalSecuritySubsidyWorkflowData,
  getSupportingDocumentUploadPolicy,
  getUploadedDocuments,
  submitTransactionDraft
} from "@ssq/services/server";
import {
  QhdsButton,
  QhdsCard,
  QhdsCol,
  QhdsContainer,
  QhdsFileUpload,
  QhdsFooter,
  QhdsHeader,
  QhdsLayout,
  QhdsPageAlert,
  QhdsRow
} from "@ssq/ui-library";

import styles from "./RentalSecuritySubsidyHomeContainer.module.scss";

import type { PrototypeSubmitResult, PrototypeUploadedDocument, PrototypeUploadPolicy, PrototypeWorkflowData } from "@ssq/services";

function formatStatus(status: string): string {
  return status
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function RentalSecuritySubsidyStatusContent({
  submitResult,
  supportingDocuments,
  uploadPolicy,
  workflow
}: {
  submitResult: PrototypeSubmitResult;
  supportingDocuments: PrototypeUploadedDocument[];
  uploadPolicy: PrototypeUploadPolicy;
  workflow: PrototypeWorkflowData;
}) {
  return (
    <QhdsLayout footer={<QhdsFooter />} header={<QhdsHeader />}>
      <QhdsContainer aria-labelledby="page-title">
        <h1 className={styles.title} id="page-title">
          Rental Security Subsidy application status
        </h1>
        <p className={styles.lead}>Track the mock submission produced by the frontend-only rental workflow.</p>

        <QhdsPageAlert heading="Application submitted" tone="success">
          <p>
            Reference <strong>{submitResult.referenceNumber}</strong> is currently{" "}
            <strong>{formatStatus(submitResult.status)}</strong>.
          </p>
        </QhdsPageAlert>

        <QhdsRow className={styles.cardGrid}>
          <QhdsCol lg={6} xl={6}>
            <QhdsCard action={<QhdsButton href="/apply">Review application</QhdsButton>} heading="Request summary">
              <p>
                Applicant: <strong>{workflow.profile.displayName}</strong>
              </p>
              <p>
                Summary file: <strong>{submitResult.summary.filename}</strong>
              </p>
              <p>
                <a href={submitResult.summary.href}>Download submission summary</a>
              </p>
            </QhdsCard>
          </QhdsCol>

          <QhdsCol lg={6} xl={6}>
            <QhdsCard heading="Supporting documents">
              <QhdsFileUpload
                hint="The mock upload policy shows accepted and rejected file states without storing real files."
                label="Upload supporting documents"
                name="supportingDocuments"
                policy={uploadPolicy}
                uploadedFiles={supportingDocuments}
              />
            </QhdsCard>
          </QhdsCol>

          <QhdsCol lg={6} xl={6}>
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
          </QhdsCol>
        </QhdsRow>
      </QhdsContainer>
    </QhdsLayout>
  );
}

export async function RentalSecuritySubsidyStatusContainer() {
  const [workflow, submitResult, uploadPolicy, supportingDocuments] = await Promise.all([
    getRentalSecuritySubsidyWorkflowData(),
    submitTransactionDraft("rental-security-subsidy"),
    getSupportingDocumentUploadPolicy(),
    getUploadedDocuments("rental-security-subsidy")
  ]);

  return (
    <RentalSecuritySubsidyStatusContent
      submitResult={submitResult}
      supportingDocuments={supportingDocuments}
      uploadPolicy={uploadPolicy}
      workflow={workflow}
    />
  );
}
