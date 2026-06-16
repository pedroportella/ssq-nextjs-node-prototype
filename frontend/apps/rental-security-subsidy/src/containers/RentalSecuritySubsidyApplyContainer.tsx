import {
  createTransactionDraft,
  getRentalSecuritySubsidyWorkflowData,
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
  QhdsTextarea,
  QhdsWorkflowLayout
} from "@ssq/ui-library";

import styles from "./RentalSecuritySubsidyHomeContainer.module.scss";

import type {
  PrototypeDraftMutationResult,
  PrototypeSubmitResult,
  PrototypeWorkflowData
} from "@ssq/services";
import type { QhdsProgressStepStatus } from "@ssq/ui-library";

const workflowSteps = [
  "Before you begin",
  "About you",
  "Contact details",
  "Household",
  "Income",
  "Rental property",
  "Evidence",
  "Review",
  "Declaration",
  "Confirmation"
];

const currentWorkflowStep = "Evidence";

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
  const uploadPolicy = workflow.uploadPolicy;

  return (
    <QhdsLayout contentWidth="task" focusMode footer={<QhdsFooter />} header={<QhdsHeader />} mainLabel="Rental Security Subsidy application">
      <QhdsWorkflowLayout
        actions={
          <>
            <QhdsButton href="/application-status">Review submission</QhdsButton>
            <QhdsButton href="/" variant="secondary">Back to landing page</QhdsButton>
          </>
        }
        backLink={<QhdsDirectionLink href="/">Back to Rental Security Subsidy landing page</QhdsDirectionLink>}
        contextLabel="Rental Security Subsidy"
        heading="Prepare your rental support application"
        lead="This prototype form shows draft, validation and submit states for the rental support workflow."
        progress={<QhdsProgressIndicator label="Rental Security Subsidy application progress" steps={rentalSecuritySubsidyProgressSteps} />}
        requiredText="All fields are required unless marked optional."
      >
        <form aria-label="Rental Security Subsidy application details" className={`qld__form ${styles.workflowForm}`} noValidate>
          <p className={styles.workflowReference}>
            Created draft <strong>{createdDraft.draft.draftId}</strong> for {createdDraft.draft.title}.
            <span className={styles.meta}>No validation errors were returned on draft creation.</span>
          </p>

          <fieldset className={styles.workflowSection}>
            <legend className={`qld__fieldset__legend ${styles.workflowLegend}`}>About you</legend>
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
          </fieldset>

          <fieldset className={styles.workflowSection}>
            <legend className={`qld__fieldset__legend ${styles.workflowLegend}`}>Household and income</legend>
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
          </fieldset>

          <fieldset className={styles.workflowSection}>
            <legend className={`qld__fieldset__legend ${styles.workflowLegend}`}>Rental property</legend>
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
              hint="The backend-compatible error path is rentalProperty.weeklyRent."
              id="weekly-rent"
              label="Weekly rent"
              name="weeklyRent"
              required
              type="number"
            />
            <QhdsTextarea
              hint="Keep this brief. Evidence can be grouped by person in the next section."
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
          </fieldset>

          <fieldset className={styles.workflowSection}>
            <legend className={`qld__fieldset__legend ${styles.workflowLegend}`}>Evidence</legend>
            <QhdsCategorizedFileUpload
              categories={uploadPolicy.allowedCategories}
              hint="Attach rental, income or identity evidence and assign each file to the right person."
              id="rental-evidence"
              label="Upload evidence by person"
              name="rentalEvidence"
              people={[
                {
                  hint: "Rental property and identity evidence for the applicant.",
                  key: uploadPolicy.defaultPersonKey,
                  label: workflow.profile.displayName
                },
                {
                  hint: "Income or household evidence for the other household member.",
                  key: "household-member",
                  label: "Household member"
                }
              ]}
              policy={uploadPolicy}
            />
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
