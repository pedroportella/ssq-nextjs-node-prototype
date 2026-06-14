import { getRentalSecuritySubsidyShellData, getRentalSecuritySubsidyWorkflowData } from "@ssq/services/server";
import {
  QhdsButton,
  QhdsCard,
  QhdsCol,
  QhdsContainer,
  QhdsContentSection,
  QhdsFooter,
  QhdsHeader,
  QhdsLayout,
  QhdsPageAlert,
  QhdsPageHeader,
  QhdsRow,
  QhdsSummaryList
} from "@ssq/ui-library";

import styles from "./RentalSecuritySubsidyHomeContainer.module.scss";

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
    <QhdsLayout footer={<QhdsFooter />} header={<QhdsHeader />}>
      <QhdsContainer aria-labelledby="page-title">
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
          lead="Prepare a prototype rental support application and track its progress."
        />

        <QhdsPageAlert heading="Frontend-only rental workflow" tone="success">
          <p>
            This rental support journey is using {shell.dataSource} data from the frontend service layer, including mock draft,
            validation and submission responses.
          </p>
        </QhdsPageAlert>

        <QhdsContentSection heading="Manage this application">
          <QhdsRow className={styles.sectionGrid}>
            <QhdsCol lg={4} xl={4}>
              <QhdsCard action={<QhdsButton href="/apply">Start application</QhdsButton>} heading="Apply for rental support">
                <p>Complete a multi-step prototype workflow covering household, income and rental property details.</p>
              </QhdsCard>
            </QhdsCol>
            <QhdsCol lg={4} xl={4}>
              <QhdsCard action={<QhdsButton href="/application-status" variant="secondary">View status</QhdsButton>} heading="Track your request">
                <p>
                  View mock submission reference <strong>{workflow.submittedRequest.referenceNumber}</strong> and recent activity.
                </p>
              </QhdsCard>
            </QhdsCol>
            <QhdsCol lg={4} xl={4}>
              <QhdsCard heading="Saved draft">
                <p>
                  Draft <strong>{workflow.draft.draftId}</strong> is ready to continue.
                </p>
                <p className={styles.meta}>Last updated {new Date(workflow.draft.lastUpdated).toLocaleString("en-AU")}</p>
              </QhdsCard>
            </QhdsCol>
          </QhdsRow>
        </QhdsContentSection>
      </QhdsContainer>
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
