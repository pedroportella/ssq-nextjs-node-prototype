import { getSeniorsCardShellData, getSeniorsCardWorkflowData } from "@ssq/services/server";
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

import styles from "./SeniorsCardHomeContainer.module.scss";

import type { AppShellData } from "@ssq/services/server";
import type { PrototypeWorkflowData } from "@ssq/services";

export function SeniorsCardOverviewContent({ shell, workflow }: { shell: AppShellData; workflow: PrototypeWorkflowData }) {
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
          lead="Check eligibility and prepare a prototype Seniors Card application."
        />

        <QhdsPageAlert heading="Frontend-only workflow" tone="success">
          <p>
            This Seniors Card journey is using {shell.dataSource} data from the frontend service layer, including mock draft,
            validation and submission responses.
          </p>
        </QhdsPageAlert>

        <QhdsContentSection heading="Manage this application">
          <QhdsRow className={styles.sectionGrid}>
            <QhdsCol lg={4} xl={4}>
              <QhdsCard action={<QhdsButton href="/apply">Start application</QhdsButton>} heading="Apply for a Seniors Card">
                <p>Check your eligibility, review prefilled details and prepare a draft application.</p>
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

export async function SeniorsCardOverviewContainer() {
  const [shell, workflow] = await Promise.all([getSeniorsCardShellData(), getSeniorsCardWorkflowData()]);

  return <SeniorsCardOverviewContent shell={shell} workflow={workflow} />;
}
