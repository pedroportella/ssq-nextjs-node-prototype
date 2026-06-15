import { getSeniorsCardShellData, getSeniorsCardWorkflowData } from "@ssq/services/server";
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

import styles from "./SeniorsCardHomeContainer.module.scss";
import { SeniorsCardSideNav } from "./SeniorsCardSideNav";

import type { AppShellData } from "@ssq/services/server";
import type { PrototypeWorkflowData } from "@ssq/services";

export function SeniorsCardOverviewContent({ shell, workflow }: { shell: AppShellData; workflow: PrototypeWorkflowData }) {
  return (
    <QhdsLayout
      contentLabelledBy="page-title"
      footer={<QhdsFooter />}
      header={<QhdsHeader />}
      sideNav={<SeniorsCardSideNav activeHref="/" />}
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
        lead="Check what you need before starting the focused Seniors Card application form."
      />

      <QhdsPageAlert heading="Frontend-only workflow" tone="success">
        <p>
          This Seniors Card journey is using {shell.dataSource} data from the frontend service layer, including mock draft,
          validation and submission responses.
        </p>
      </QhdsPageAlert>

      <QhdsContentSection
        heading="About this service"
        id="about-service"
        lead="Use this landing page to confirm the service context before entering the multistep form."
      >
        <p>
          You can start a Seniors Card application, review the prefilled profile details and return to this landing page before
          continuing the focused form.
        </p>
        <QhdsSummaryList
          ariaLabel="Saved Seniors Card application"
          items={[
            { description: workflow.draft.draftId, term: "Saved draft" },
            { description: workflow.submittedRequest.referenceNumber, term: "Latest reference" },
            { description: workflow.profile.identityStrength, term: "Identity" }
          ]}
        />
      </QhdsContentSection>

      <QhdsContentSection heading="Eligibility" id="eligibility">
        <ul>
          <li>You live in Queensland.</li>
          <li>You meet the Seniors Card age or concession requirements for this prototype.</li>
          <li>You can review the profile details already available from the mock service layer.</li>
        </ul>
      </QhdsContentSection>

      <QhdsContentSection heading="Before you start" id="before-you-start">
        <p>
          The form opens in focus mode with progress, field validation and draft submission states. Keep identity evidence nearby if
          supporting documents are requested later.
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

export async function SeniorsCardOverviewContainer() {
  const [shell, workflow] = await Promise.all([getSeniorsCardShellData(), getSeniorsCardWorkflowData()]);

  return <SeniorsCardOverviewContent shell={shell} workflow={workflow} />;
}
