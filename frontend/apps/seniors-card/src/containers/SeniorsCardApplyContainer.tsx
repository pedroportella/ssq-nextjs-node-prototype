import {
  createTransactionDraft,
  getSeniorsCardWorkflowData,
  recordSupportingDocumentUploadMetadata,
  submitTransactionDraft,
  updateTransactionDraftWithValidationError
} from "@ssq/services/server";
import {
  QhdsButton,
  QhdsCategorizedFileUpload,
  QhdsCheckbox,
  QhdsDirectionLink,
  QhdsFooter,
  QhdsHeader,
  QhdsLayout,
  QhdsProgressIndicator,
  QhdsRadioGroup,
  QhdsSelect,
  QhdsTextInput,
  QhdsWorkflowLayout
} from "@ssq/ui-library";

import styles from "./SeniorsCardHomeContainer.module.scss";

import type {
  PrototypeDraftMutationResult,
  PrototypeSubmitResult,
  PrototypeSupportingDocumentUploadResult,
  PrototypeUploadPolicy,
  PrototypeWorkflowData
} from "@ssq/services";

const seniorsCardProgressSteps = [
  { id: "eligibility", label: "Eligibility", status: "current" as const },
  { id: "supporting-evidence", label: "Supporting evidence", status: "upcoming" as const },
  { id: "review-details", label: "Review details", status: "upcoming" as const },
  { id: "declaration", label: "Declaration", status: "upcoming" as const },
  { id: "confirmation", label: "Confirmation", status: "upcoming" as const }
];

export function SeniorsCardApplyContent({
  createdDraft,
  evidenceUploadResult,
  submitResult,
  uploadPolicy,
  validationResult,
  workflow
}: {
  createdDraft: PrototypeDraftMutationResult;
  evidenceUploadResult: PrototypeSupportingDocumentUploadResult;
  submitResult: PrototypeSubmitResult;
  uploadPolicy: PrototypeUploadPolicy;
  validationResult: PrototypeDraftMutationResult;
  workflow: PrototypeWorkflowData;
}) {
  const dateOfBirthError = validationResult.validationErrors.find((error) => error.fieldPath === "eligibility.dateOfBirth");
  const evidenceUploadStatus = evidenceUploadResult.ok
    ? evidenceUploadResult.document?.fileName ?? "supporting evidence metadata"
    : evidenceUploadResult.error?.message ?? "Supporting evidence metadata was not recorded.";

  return (
    <QhdsLayout contentWidth="task" focusMode footer={<QhdsFooter />} header={<QhdsHeader />} mainLabel="Seniors Card application">
      <QhdsWorkflowLayout
        actions={
          <>
            <QhdsButton href="/application-status">Review submission</QhdsButton>
            <QhdsButton href="/" variant="secondary">Back to landing page</QhdsButton>
          </>
        }
        backLink={<QhdsDirectionLink href="/">Back to Seniors Card landing page</QhdsDirectionLink>}
        contextLabel="Seniors Card"
        heading="Check your eligibility"
        lead="This prototype form shows draft, validation and submit states for a Seniors Card application."
        progress={<QhdsProgressIndicator label="Seniors Card application progress" steps={seniorsCardProgressSteps} />}
        requiredText="All fields are required unless marked optional."
      >
        <form aria-label="Seniors Card application details" className={`qld__form ${styles.workflowForm}`} noValidate>
          <p className={styles.workflowReference}>
            Created draft <strong>{createdDraft.draft.draftId}</strong> for {createdDraft.draft.title}.
            <span className={styles.meta}>No validation errors were returned on draft creation.</span>
          </p>

          <fieldset className={styles.workflowSection}>
            <legend className={`qld__fieldset__legend ${styles.workflowLegend}`}>Eligibility details</legend>
            <QhdsTextInput
              hint="Use the name shown on your identity documents."
              id="full-name"
              label="Full name"
              name="fullName"
              readOnly
              required
              value={workflow.profile.displayName}
            />
            <QhdsTextInput
              error={dateOfBirthError?.message}
              hint="The backend-compatible error path is eligibility.dateOfBirth."
              id="date-of-birth"
              label="Date of birth"
              name="dateOfBirth"
              required
              type="date"
            />
            <QhdsSelect
              defaultValue="qld"
              hint="You must live in Queensland to apply for this prototype Seniors Card workflow."
              id="residential-state"
              label="Residential state"
              name="residentialState"
              options={[
                { label: "Queensland", value: "qld" },
                { label: "Other Australian state or territory", value: "other" }
              ]}
              required
            />
            <QhdsRadioGroup
              defaultValue="yes"
              id="age-eligible"
              legend="Are you 65 years or older?"
              name="ageEligible"
              options={[
                { label: "Yes", value: "yes" },
                { label: "No", value: "no" }
              ]}
              required
            />
            <QhdsCheckbox
              id="declaration"
              label="I declare this prototype information is ready for review."
              name="declaration"
              required
            />
          </fieldset>

          <fieldset className={styles.workflowSection}>
            <legend className={`qld__fieldset__legend ${styles.workflowLegend}`}>Supporting evidence</legend>
            <QhdsCategorizedFileUpload
              categories={uploadPolicy.allowedCategories}
              hint="Attach identity, residency or concession evidence for assessment."
              id="supporting-evidence"
              label="Upload supporting evidence"
              name="supportingEvidence"
              people={[
                {
                  hint: "Evidence is grouped under the applicant for this Seniors Card request.",
                  key: uploadPolicy.defaultPersonKey,
                  label: workflow.profile.displayName
                }
              ]}
              policy={uploadPolicy}
            />
            <p className={styles.workflowReference}>
              Metadata proof <strong>{evidenceUploadStatus}</strong>.
              <span className={styles.meta}>
                Server policy allows {uploadPolicy.maxFilesPerPerson} files and {Math.round(uploadPolicy.maxTotalSizeBytesPerPerson / (1024 * 1024))} MB per person.
              </span>
            </p>
          </fieldset>

          <p className={styles.workflowReference}>
            Submission <strong>{submitResult.referenceNumber}</strong> returned status{" "}
            <strong>{submitResult.status.toLowerCase().replace("_", " ")}</strong>.
            <span className={styles.meta}>Summary placeholder: {submitResult.summary.filename}</span>
          </p>
        </form>
      </QhdsWorkflowLayout>
    </QhdsLayout>
  );
}

export async function SeniorsCardApplyContainer() {
  const [workflow, createdDraft, validationResult, submitResult] = await Promise.all([
    getSeniorsCardWorkflowData(),
    createTransactionDraft("seniors-card"),
    updateTransactionDraftWithValidationError("seniors-card"),
    submitTransactionDraft("seniors-card")
  ]);
  const evidenceUploadResult = await recordSupportingDocumentUploadMetadata({
    category: "identity",
    fileName: "identity-evidence.pdf",
    mimeType: "application/pdf",
    personKey: workflow.uploadPolicy.defaultPersonKey,
    sizeBytes: 512_000,
    target: {
      draftId: createdDraft.draft.draftId,
      type: "DRAFT"
    }
  });

  return (
    <SeniorsCardApplyContent
      createdDraft={createdDraft}
      evidenceUploadResult={evidenceUploadResult}
      submitResult={submitResult}
      uploadPolicy={evidenceUploadResult.policy}
      validationResult={validationResult}
      workflow={workflow}
    />
  );
}
