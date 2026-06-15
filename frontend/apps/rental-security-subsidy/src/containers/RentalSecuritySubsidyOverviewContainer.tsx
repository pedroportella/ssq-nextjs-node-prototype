import { getRentalSecuritySubsidyShellData, getRentalSecuritySubsidyWorkflowData } from "@ssq/services/server";
import {
  QhdsButton,
  QhdsContentSection,
  QhdsFooter,
  QhdsHeader,
  QhdsLayout,
  QhdsPageAlert,
  QhdsPageHeader,
  QhdsSummaryList
} from "@ssq/ui-library";

import styles from "./RentalSecuritySubsidyHomeContainer.module.scss";
import { RentalSecuritySubsidySideNav } from "./RentalSecuritySubsidySideNav";

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
    <QhdsLayout
      contentLabelledBy="page-title"
      footer={<QhdsFooter />}
      header={<QhdsHeader />}
      sideNav={<RentalSecuritySubsidySideNav activeHref="/" />}
    >
      <QhdsPageHeader
        aside={
          <QhdsSummaryList
            ariaLabel="Applicant summary"
            items={[
              { description: workflow.profile.displayName, term: "Applicant" },
              { description: workflow.profile.email, term: "Email" },
              { description: workflow.profile.identityStrength, term: "Identity" }
            ]}
          />
        }
        heading={shell.app.label}
        headingId="page-title"
        lead="Check what you need before starting the focused Rental Security Subsidy application form."
      />

      <QhdsPageAlert heading="Frontend-only rental workflow" tone="success">
        <p>
          This rental support journey is using {shell.dataSource} data from the frontend service layer, including mock draft,
          validation and submission responses.
        </p>
      </QhdsPageAlert>

      <QhdsContentSection
        heading="About this service"
        id="about-service"
        lead="Use this landing page to confirm the service context before entering the multistep form."
      >
        <p>
          You can start a rental support application, review the prefilled household details and return to this landing page before
          continuing the focused form.
        </p>
        <QhdsSummaryList
          ariaLabel="Saved Rental Security Subsidy application"
          items={[
            { description: workflow.draft.draftId, term: "Saved draft" },
            { description: workflow.submittedRequest.referenceNumber, term: "Latest reference" },
            { description: workflow.profile.identityStrength, term: "Identity" }
          ]}
        />
      </QhdsContentSection>

      <QhdsContentSection heading="Eligibility" id="eligibility">
        <ul>
          <li>You rent in Queensland or are preparing to enter a private rental arrangement.</li>
          <li>You can provide household and income details for this prototype request.</li>
          <li>You can review rental property details before submitting the focused form.</li>
        </ul>
      </QhdsContentSection>

      <QhdsContentSection heading="Before you start" id="before-you-start">
        <p>
          The form opens in focus mode with progress, validation and draft submission states. Keep rental evidence nearby if supporting
          documents are requested later.
        </p>
        <p className={styles.meta}>Last draft update: {new Date(workflow.draft.lastUpdated).toLocaleString("en-AU")}</p>
      </QhdsContentSection>

      <QhdsContentSection heading="Start application" id="start-application">
        <p>The next step opens the multistep form without the landing page side navigation.</p>
        <div className={styles.sectionActions}>
          <QhdsButton href="/apply">Start application</QhdsButton>
          <QhdsButton href="/application-status" variant="secondary">View application status</QhdsButton>
        </div>
      </QhdsContentSection>
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
