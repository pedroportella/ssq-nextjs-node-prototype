import { getDashboardShellData, getDashboardSummaryData } from "@ssq/services/server";
import {
  QhdsButton,
  QhdsCard,
  QhdsCol,
  QhdsContentSection,
  QhdsFooter,
  QhdsHeader,
  QhdsLayout,
  QhdsPageAlert,
  QhdsPageHeader,
  QhdsRow,
  QhdsSummaryList,
  QhdsTable
} from "@ssq/ui-library";

import styles from "./DashboardHomeContainer.module.scss";

import type { AppShellData } from "@ssq/services/server";
import type { PrototypeActivityEntry, PrototypeDashboardSummaryData, PrototypeServiceCatalogueEntry } from "@ssq/services";

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("en-AU", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Australia/Brisbane"
  }).format(new Date(value));
}

function formatStatus(status: string): string {
  return status
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function renderEmptyState(message: string) {
  return <p className={styles.empty}>{message}</p>;
}

function ServiceCards({ services }: { services: PrototypeServiceCatalogueEntry[] }) {
  if (services.length === 0) {
    return renderEmptyState("No services are available right now.");
  }

  return (
    <QhdsRow className={styles.sectionGrid}>
      {services.map((service) => (
        <QhdsCol lg={4} xl={4} key={service.appKey}>
          <QhdsCard action={<QhdsButton href={service.href} variant="secondary">Open service</QhdsButton>} heading={service.label}>
            <p className={styles.itemDescription}>{service.description}</p>
          </QhdsCard>
        </QhdsCol>
      ))}
    </QhdsRow>
  );
}

function DraftsTable({ summary }: { summary: PrototypeDashboardSummaryData }) {
  if (summary.drafts.length === 0) {
    return renderEmptyState("No saved drafts.");
  }

  return (
    <QhdsTable
      caption="Saved drafts"
      columns={[
        { header: "Draft", key: "draft" },
        { header: "Status", key: "status" },
        { header: "Last updated", key: "lastUpdated" }
      ]}
      rows={summary.drafts.map((draft) => ({
        draft: (
          <>
            <strong>{draft.title}</strong>
            <span className={styles.meta}>{draft.draftId}</span>
          </>
        ),
        id: draft.draftId,
        lastUpdated: formatDateTime(draft.lastUpdated),
        status: formatStatus(draft.status)
      }))}
      striped
    />
  );
}

function SubmittedRequestsTable({ summary }: { summary: PrototypeDashboardSummaryData }) {
  if (summary.submittedRequests.length === 0) {
    return renderEmptyState("No submitted requests.");
  }

  return (
    <QhdsTable
      caption="Submitted requests"
      columns={[
        { header: "Request", key: "request" },
        { header: "Status", key: "status" },
        { header: "Submitted", key: "submitted" }
      ]}
      rows={summary.submittedRequests.map((request) => ({
        id: request.referenceNumber,
        request: (
          <>
            <strong>{request.title}</strong>
            <span className={styles.meta}>{request.referenceNumber}</span>
          </>
        ),
        status: formatStatus(request.status),
        submitted: formatDateTime(request.submittedAt)
      }))}
      striped
    />
  );
}

function ActivityTable({ activity }: { activity: PrototypeActivityEntry[] }) {
  if (activity.length === 0) {
    return renderEmptyState("No recent activity to show.");
  }

  return (
    <QhdsTable
      caption="Recent activity"
      columns={[
        { header: "Activity", key: "activity" },
        { header: "Status", key: "status" },
        { header: "Date", key: "date" }
      ]}
      rows={activity.map((entry, index) => ({
        activity: entry.description,
        date: formatDateTime(entry.at),
        id: `${entry.at}-${index}`,
        status: formatStatus(entry.status)
      }))}
      striped
    />
  );
}

export function DashboardContent({ shell, summary }: { shell: AppShellData; summary: PrototypeDashboardSummaryData }) {
  const activeRequests = summary.drafts.length + summary.submittedRequests.length;

  return (
    <QhdsLayout contentLabelledBy="page-title" footer={<QhdsFooter />} header={<QhdsHeader />}>
      <QhdsPageHeader
        aside={
          <QhdsSummaryList
            ariaLabel="Profile summary"
            items={[
              { description: summary.profile.displayName, term: "Signed in as" },
              { description: summary.profile.email, term: "Email" },
              { description: formatStatus(summary.profile.identityStrength), term: "Identity" }
            ]}
          />
        }
        heading={shell.app.label}
        headingId="page-title"
        lead="Review digital transaction activity across the prototype services."
      />

      <QhdsPageAlert heading="Frontend mock runtime" tone={shell.dataSource === "mock" ? "success" : "info"}>
        <p>
          Dashboard data is currently served from the {shell.dataSource} frontend service layer, so this page can be developed
          without Docker or a live backend.
        </p>
      </QhdsPageAlert>

      <QhdsContentSection heading="Dashboard summary">
        <QhdsSummaryList
          ariaLabel="Dashboard summary"
          items={[
            { description: summary.availableServices.length, term: "Available services" },
            { description: summary.drafts.length, term: "Drafts" },
            { description: summary.submittedRequests.length, term: "Submitted requests" },
            { description: activeRequests, term: "Active records" }
          ]}
        />
      </QhdsContentSection>

      <QhdsContentSection heading="Available services">
        <ServiceCards services={summary.availableServices} />
      </QhdsContentSection>

      <QhdsContentSection heading="Current records">
        <QhdsRow className={styles.sectionGrid}>
          <QhdsCol lg={6} xl={6}>
            <DraftsTable summary={summary} />
          </QhdsCol>
          <QhdsCol lg={6} xl={6}>
            <SubmittedRequestsTable summary={summary} />
          </QhdsCol>
        </QhdsRow>
      </QhdsContentSection>

      <QhdsContentSection heading="Recent activity">
        <ActivityTable activity={summary.activity} />
      </QhdsContentSection>
    </QhdsLayout>
  );
}

export async function DashboardHomeContainer() {
  const [shell, summary] = await Promise.all([getDashboardShellData(), getDashboardSummaryData()]);

  return <DashboardContent shell={shell} summary={summary} />;
}
