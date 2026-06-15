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
  QhdsCol,
  QhdsDirectionLink,
  QhdsFooter,
  QhdsHeader,
  QhdsLayout,
  QhdsProgressIndicator,
  QhdsRadioGroup,
  QhdsRow,
  QhdsSelect,
  QhdsTextInput,
  QhdsWorkflowLayout
} from "@ssq/ui-library";

import styles from "./SeniorsCardHomeContainer.module.scss";

import type { PrototypeDraftMutationResult, PrototypeSubmitResult, PrototypeWorkflowData } from "@ssq/services";

const seniorsCardProgressSteps = [
  { id: "eligibility", label: "Eligibility", status: "current" as const },
  { id: "review-details", label: "Review details", status: "upcoming" as const },
  { id: "declaration", label: "Declaration", status: "upcoming" as const },
  { id: "confirmation", label: "Confirmation", status: "upcoming" as const }
];

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
    <QhdsLayout contentWidth="task" focusMode footer={<QhdsFooter />} header={<QhdsHeader />} mainLabel="Seniors Card application">
      <QhdsWorkflowLayout
        actions={
          <>
            <QhdsButton href="/application-status">Review mock submission</QhdsButton>
            <QhdsButton href="/" variant="secondary">Back to landing page</QhdsButton>
          </>
        }
        backLink={<QhdsDirectionLink href="/">Back to Seniors Card landing page</QhdsDirectionLink>}
        contextLabel="Seniors Card"
        heading="Check your eligibility"
        lead="This frontend-only slice shows the draft, validation and submit states using F13 mock services."
        progress={<QhdsProgressIndicator label="Seniors Card application progress" steps={seniorsCardProgressSteps} />}
        requiredText="All fields are required unless marked optional."
      >
        <form aria-label="Seniors Card application details" className={`qld__form ${styles.workflowForm}`} noValidate>
          <QhdsRow className={styles.workflowGrid}>
            <QhdsCol lg={4} xl={4}>
              <QhdsCard heading="Draft state">
                <p>
                  Created draft <strong>{createdDraft.draft.draftId}</strong> for {createdDraft.draft.title}.
                </p>
                <p className={styles.meta}>No validation errors were returned on draft creation.</p>
              </QhdsCard>
            </QhdsCol>

            <QhdsCol lg={8} xl={8}>
              <QhdsCard heading="Eligibility details">
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
                  hint="For this mock state, the backend-compatible error path is eligibility.dateOfBirth."
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
              </QhdsCard>
            </QhdsCol>

            <QhdsCol lg={4} xl={4}>
              <QhdsCard heading="Submit result">
                <p>
                  Mock submission <strong>{submitResult.referenceNumber}</strong> returned status{" "}
                  <strong>{submitResult.status.toLowerCase().replace("_", " ")}</strong>.
                </p>
                <p className={styles.meta}>Summary placeholder: {submitResult.summary.filename}</p>
              </QhdsCard>
            </QhdsCol>
          </QhdsRow>
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

  return (
    <SeniorsCardApplyContent
      createdDraft={createdDraft}
      submitResult={submitResult}
      validationResult={validationResult}
      workflow={workflow}
    />
  );
}
