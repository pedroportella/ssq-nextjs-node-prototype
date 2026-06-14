import {
  createTransactionDraft,
  getRentalSecuritySubsidyWorkflowData,
  submitTransactionDraft,
  updateTransactionDraftWithValidationError
} from "@ssq/services/server";
import {
  QhdsButton,
  QhdsCard,
  QhdsCheckbox,
  QhdsCol,
  QhdsContainer,
  QhdsDirectionLink,
  QhdsFooter,
  QhdsHeader,
  QhdsLayout,
  QhdsProgressIndicator,
  QhdsRadioGroup,
  QhdsRow,
  QhdsSelect,
  QhdsTextInput,
  QhdsTextarea,
  QhdsWorkflowLayout
} from "@ssq/ui-library";

import styles from "./RentalSecuritySubsidyHomeContainer.module.scss";

import type { PrototypeDraftMutationResult, PrototypeSubmitResult, PrototypeWorkflowData } from "@ssq/services";
import type { QhdsProgressStepStatus } from "@ssq/ui-library";

const workflowSteps = [
  "Before you begin",
  "About you",
  "Contact details",
  "Household",
  "Income",
  "Rental property",
  "Review",
  "Declaration",
  "Confirmation"
];

const currentWorkflowStep = "Rental property";

const rentalSecuritySubsidyProgressSteps = workflowSteps.map((step) => {
  const currentStepIndex = workflowSteps.indexOf(currentWorkflowStep);
  const stepIndex = workflowSteps.indexOf(step);
  const status: QhdsProgressStepStatus =
    step === currentWorkflowStep ? "current" : stepIndex < currentStepIndex ? "completed" : "upcoming";

  return {
    id: step.toLowerCase().replaceAll(" ", "-"),
    label: step,
    status
  };
});

export function RentalSecuritySubsidyApplyContent({
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
  const weeklyRentError = validationResult.validationErrors.find((error) => error.fieldPath === "rentalProperty.weeklyRent");

  return (
    <QhdsLayout focusMode footer={<QhdsFooter />} header={<QhdsHeader />} mainLabel="Rental Security Subsidy application">
      <QhdsContainer>
        <QhdsWorkflowLayout
          actions={
            <>
              <QhdsButton href="/application-status">Review mock submission</QhdsButton>
              <QhdsButton href="/" variant="secondary">Back to overview</QhdsButton>
            </>
          }
          backLink={<QhdsDirectionLink href="/">Back to rental support overview</QhdsDirectionLink>}
          contextLabel="Rental Security Subsidy"
          heading="Prepare your rental support application"
          lead="This frontend-only slice shows the deeper rental workflow using F13 mock draft, validation and submit services."
          progress={<QhdsProgressIndicator label="Rental Security Subsidy application progress" steps={rentalSecuritySubsidyProgressSteps} />}
          requiredText="All fields are required unless marked optional."
        >
          <form aria-label="Rental Security Subsidy application details" className={`qld__form ${styles.workflowForm}`} noValidate>
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
                <QhdsCard heading="About you">
                  <QhdsTextInput
                    id="full-name"
                    label="Full name"
                    name="fullName"
                    readOnly
                    required
                    value={workflow.profile.displayName}
                  />
                  <QhdsTextInput
                    id="email"
                    label="Email address"
                    name="email"
                    readOnly
                    required
                    type="email"
                    value={workflow.profile.email}
                  />
                  <QhdsSelect
                    defaultValue="bond"
                    id="support-type"
                    label="Support type"
                    name="supportType"
                    options={[
                      { label: "Bond assistance", value: "bond" },
                      { label: "Rental security subsidy", value: "subsidy" }
                    ]}
                    required
                  />
                </QhdsCard>
              </QhdsCol>

              <QhdsCol lg={6} xl={6}>
                <QhdsCard heading="Household and income">
                  <QhdsRadioGroup
                    defaultValue="private-rental"
                    id="housing-situation"
                    legend="Housing situation"
                    name="housingSituation"
                    options={[
                      { hint: "You rent from a private owner or real estate agent.", label: "Private rental", value: "private-rental" },
                      { hint: "You are moving from crisis or supported accommodation.", label: "Supported accommodation", value: "supported-accommodation" }
                    ]}
                    required
                  />
                  <QhdsTextInput
                    id="household-members"
                    label="Household members"
                    name="householdMembers"
                    readOnly
                    required
                    type="number"
                    value="2"
                  />
                  <QhdsTextInput
                    id="income"
                    label="Fortnightly household income"
                    name="income"
                    readOnly
                    required
                    value="$1,240"
                  />
                </QhdsCard>
              </QhdsCol>

              <QhdsCol lg={6} xl={6}>
                <QhdsCard heading="Rental property">
                  <QhdsTextInput
                    hint="Enter the suburb for the property related to this request."
                    id="rental-suburb"
                    label="Rental suburb"
                    name="rentalSuburb"
                    readOnly
                    required
                    value="Mackay"
                  />
                  <QhdsTextInput
                    error={weeklyRentError?.message}
                    hint="For this mock state, the backend-compatible error path is rentalProperty.weeklyRent."
                    id="weekly-rent"
                    label="Weekly rent"
                    name="weeklyRent"
                    required
                    type="number"
                  />
                  <QhdsTextarea
                    hint="Keep this brief. Evidence upload comes later."
                    id="additional-details"
                    label="Anything else we should know?"
                    name="additionalDetails"
                    optional
                    readOnly
                    value="Applicant is preparing documents for review."
                  />
                  <QhdsCheckbox
                    id="declaration"
                    label="I declare the rental support information is ready for review."
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
      </QhdsContainer>
    </QhdsLayout>
  );
}

export async function RentalSecuritySubsidyApplyContainer() {
  const [workflow, createdDraft, validationResult, submitResult] = await Promise.all([
    getRentalSecuritySubsidyWorkflowData(),
    createTransactionDraft("rental-security-subsidy"),
    updateTransactionDraftWithValidationError("rental-security-subsidy"),
    submitTransactionDraft("rental-security-subsidy")
  ]);

  return (
    <RentalSecuritySubsidyApplyContent
      createdDraft={createdDraft}
      submitResult={submitResult}
      validationResult={validationResult}
      workflow={workflow}
    />
  );
}
