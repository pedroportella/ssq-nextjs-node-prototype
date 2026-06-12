import {
  createTransactionDraft,
  getSeniorsCardWorkflowData,
  submitTransactionDraft,
  updateTransactionDraftWithValidationError
} from "@ssq/services/server";
import {
  QhdsButton,
  QhdsCard,
  QhdsCheckbox,
  QhdsFooter,
  QhdsHeader,
  QhdsLayout,
  QhdsRadioGroup,
  QhdsSelect,
  QhdsTextInput,
  QhdsWorkflowLayout
} from "@ssq/ui-library";

import styles from "./SeniorsCardHomeContainer.module.scss";

import type { PrototypeDraftMutationResult, PrototypeSubmitResult, PrototypeWorkflowData } from "@ssq/services";

export function SeniorsCardApplyContent({
  createdDraft,
  submitResult,
  validationResult,
  workflow
}: {
  createdDraft: PrototypeDraftMutationResult;
  submitResult: PrototypeSubmitResult;
  validationResult: PrototypeDraftMutationResult;
  workflow: PrototypeWorkflowData;
}) {
  const dateOfBirthError = validationResult.validationErrors.find((error) => error.fieldPath === "eligibility.dateOfBirth");

  return (
    <QhdsLayout focusMode footer={<QhdsFooter />} header={<QhdsHeader />} mainLabel="Seniors Card application">
      <QhdsWorkflowLayout
        actions={
          <>
            <QhdsButton href="/application-status">Review mock submission</QhdsButton>
            <QhdsButton href="/" variant="secondary">Back to overview</QhdsButton>
          </>
        }
        backLink={<a href="/">Back to Seniors Card overview</a>}
        contextLabel="Seniors Card"
        heading="Check your eligibility"
        lead="This frontend-only slice shows the draft, validation and submit states using F13 mock services."
        progress={
          <ol className={styles.progressList}>
            <li aria-current="step">Eligibility</li>
            <li>Review details</li>
            <li>Declaration</li>
            <li>Confirmation</li>
          </ol>
        }
        requiredText="All fields are required unless marked optional."
      >
        <div className={styles.workflowGrid}>
          <QhdsCard heading="Draft state">
            <p>
              Created draft <strong>{createdDraft.draft.draftId}</strong> for {createdDraft.draft.title}.
            </p>
            <p className={styles.meta}>No validation errors were returned on draft creation.</p>
          </QhdsCard>

          <QhdsCard heading="Eligibility details">
            <QhdsTextInput
              hint="Use the name shown on your identity documents."
              label="Full name"
              name="fullName"
              readOnly
              required
              value={workflow.profile.displayName}
            />
            <QhdsTextInput
              error={dateOfBirthError?.message}
              hint="For this mock state, the backend-compatible error path is eligibility.dateOfBirth."
              label="Date of birth"
              name="dateOfBirth"
              required
              type="date"
            />
            <QhdsSelect
              defaultValue="qld"
              hint="You must live in Queensland to apply for this prototype Seniors Card workflow."
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
              legend="Are you 65 years or older?"
              name="ageEligible"
              options={[
                { label: "Yes", value: "yes" },
                { label: "No", value: "no" }
              ]}
              required
            />
            <QhdsCheckbox label="I declare this prototype information is ready for review." name="declaration" required />
          </QhdsCard>

          <QhdsCard heading="Submit result">
            <p>
              Mock submission <strong>{submitResult.referenceNumber}</strong> returned status{" "}
              <strong>{submitResult.status.toLowerCase().replace("_", " ")}</strong>.
            </p>
            <p className={styles.meta}>Summary placeholder: {submitResult.summary.filename}</p>
          </QhdsCard>
        </div>
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

  return (
    <SeniorsCardApplyContent
      createdDraft={createdDraft}
      submitResult={submitResult}
      validationResult={validationResult}
      workflow={workflow}
    />
  );
}
