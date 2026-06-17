import {
  getRentalSecuritySubsidyWorkflowData,
  getSupportingDocumentUploadPolicy,
  getUploadedDocuments,
  submitTransactionDraft
} from "@ssq/services/server";
import {
  QhdsButton,
  QhdsContentSection,
  QhdsFileUpload,
  QhdsFooter,
  QhdsHeader,
  QhdsLayout,
  QhdsPageAlert,
  QhdsPageHeader,
  QhdsSummaryList,
  QhdsTable
} from "@ssq/ui-library";

import styles from "./RentalSecuritySubsidyHomeContainer.module.scss";
import { RentalSecuritySubsidySideNav } from "./RentalSecuritySubsidySideNav";

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
    <QhdsLayout
      contentLabelledBy="page-title"
      footer={<QhdsFooter />}
      header={<QhdsHeader />}
      sideNav={<RentalSecuritySubsidySideNav activeHref="/application-status" />}
    >
      <QhdsPageHeader
        aside={
          <QhdsSummaryList
            ariaLabel="Request status summary"
            items={[
              { description: submitResult.referenceNumber, term: "Reference" },
              { description: formatStatus(submitResult.status), term: "Status" }
            ]}
          />
        }
        heading="Rental Security Subsidy application status"
        headingId="page-title"
        lead="Track the submitted rental support application through the prototype workflow."
      />

      <QhdsPageAlert heading="Application submitted" tone="success">
        <p>
          Reference <strong>{submitResult.referenceNumber}</strong> is currently{" "}
          <strong>{formatStatus(submitResult.status)}</strong>.
        </p>
      </QhdsPageAlert>

      <QhdsContentSection heading="Request summary" id="request-summary">
        <QhdsSummaryList
          ariaLabel="Request summary"
          items={[
            { description: workflow.profile.displayName, term: "Applicant" },
            { description: submitResult.summary.filename, term: "Summary file" }
          ]}
        />
        <div className={styles.sectionActions}>
          <QhdsButton href="/apply">Review application</QhdsButton>
          <a href={submitResult.summary.href}>Download submission summary</a>
        </div>
      </QhdsContentSection>

      <QhdsContentSection heading="Supporting documents" id="supporting-documents">
        <QhdsFileUpload
          hint="Document links are available when the prototype evidence store has an uploaded artifact."
          id="supporting-documents-upload"
          label="Upload supporting documents"
          name="supportingDocuments"
          policy={uploadPolicy}
          uploadedFiles={supportingDocuments}
        />
      </QhdsContentSection>

      <QhdsContentSection heading="Recent activity" id="recent-activity">
        <QhdsTable
          caption="Recent activity history"
          columns={[
            { header: "Activity", key: "activity" },
            { header: "Status", key: "status" }
          ]}
          rows={submitResult.activity.map((entry, index) => ({
            activity: entry.description,
            id: `${entry.at}-${index}`,
            status: formatStatus(entry.status)
          }))}
          striped
        />
      </QhdsContentSection>
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
