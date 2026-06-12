import { getDashboardShellData, getDashboardSummaryData } from "@ssq/services/server";
import { QhdsButton, QhdsCard, QhdsFooter, QhdsHeader, QhdsLayout, QhdsPageAlert } from "@ssq/ui-library";

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

function ServiceList({ services }: { services: PrototypeServiceCatalogueEntry[] }) {
  if (services.length === 0) {
    return renderEmptyState("No services are available right now.");
  }

  return (
    <ul className={styles.serviceList}>
      {services.map((service) => (
        <li className={styles.serviceItem} key={service.appKey}>
          <div>
            <h3 className={styles.itemTitle}>{service.label}</h3>
            <p className={styles.itemDescription}>{service.description}</p>
          </div>
          <QhdsButton href={service.href} variant="secondary">
            Open service
          </QhdsButton>
        </li>
      ))}
    </ul>
  );
}

function ActivityList({ activity }: { activity: PrototypeActivityEntry[] }) {
  if (activity.length === 0) {
    return renderEmptyState("No recent activity to show.");
  }

  return (
    <ol className={styles.activityList}>
      {activity.map((entry, index) => (
        <li className={styles.activityItem} key={`${entry.at}-${entry.description}-${index}`}>
          <span className={styles.activityMarker} aria-hidden="true" />
          <div>
            <p className={styles.activityDescription}>{entry.description}</p>
            <p className={styles.meta}>
              {formatStatus(entry.status)} · {formatDateTime(entry.at)}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function DashboardContent({ shell, summary }: { shell: AppShellData; summary: PrototypeDashboardSummaryData }) {
  const activeRequests = summary.drafts.length + summary.submittedRequests.length;

  return (
    <QhdsLayout footer={<QhdsFooter />} header={<QhdsHeader />}>
      <section aria-labelledby="page-title" className={styles.inner}>
        <div className={styles.hero}>
          <div>
            <h1 className={styles.title} id="page-title">
              {shell.app.label}
            </h1>
            <p className={styles.lead}>Review digital transaction activity across the prototype services.</p>
          </div>
          <div className={styles.profileSummary} aria-label="Profile summary">
            <p className={styles.eyebrow}>Signed in as</p>
            <p className={styles.profileName}>{summary.profile.displayName}</p>
            <p className={styles.meta}>{summary.profile.email}</p>
            <p className={styles.meta}>Identity: {formatStatus(summary.profile.identityStrength)}</p>
          </div>
        </div>

        <QhdsPageAlert heading="Frontend mock runtime" tone={shell.dataSource === "mock" ? "success" : "info"}>
          <p>
            Dashboard data is currently served from the {shell.dataSource} frontend service layer, so this page can be developed
            without Docker or a live backend.
          </p>
        </QhdsPageAlert>

        <section aria-label="Dashboard summary" className={styles.summaryGrid}>
          <div className={styles.metric}>
            <span className={styles.metricValue}>{summary.availableServices.length}</span>
            <span className={styles.metricLabel}>Available services</span>
          </div>
          <div className={styles.metric}>
            <span className={styles.metricValue}>{summary.drafts.length}</span>
            <span className={styles.metricLabel}>Drafts</span>
          </div>
          <div className={styles.metric}>
            <span className={styles.metricValue}>{summary.submittedRequests.length}</span>
            <span className={styles.metricLabel}>Submitted requests</span>
          </div>
          <div className={styles.metric}>
            <span className={styles.metricValue}>{activeRequests}</span>
            <span className={styles.metricLabel}>Active records</span>
          </div>
        </section>

        <div className={styles.grid}>
          <QhdsCard heading="Available services">
            <ServiceList services={summary.availableServices} />
          </QhdsCard>

          <QhdsCard heading="Drafts">
            {summary.drafts.length === 0
              ? renderEmptyState("No saved drafts.")
              : (
                  <ul className={styles.recordList}>
                    {summary.drafts.map((draft) => (
                      <li className={styles.recordItem} key={draft.draftId}>
                        <span>
                          <strong>{draft.title}</strong>
                          <span className={styles.meta}>Last updated {formatDateTime(draft.lastUpdated)}</span>
                        </span>
                        <span className={styles.status}>{formatStatus(draft.status)}</span>
                      </li>
                    ))}
                  </ul>
                )}
          </QhdsCard>

          <QhdsCard action={<QhdsButton href="/status">Check app status</QhdsButton>} heading="Submitted requests">
            {summary.submittedRequests.length === 0
              ? renderEmptyState("No submitted requests.")
              : (
                  <ul className={styles.recordList}>
                    {summary.submittedRequests.map((request) => (
                      <li className={styles.recordItem} key={request.referenceNumber}>
                        <span>
                          <strong>{request.title}</strong>
                          <span className={styles.meta}>
                            {request.referenceNumber} · Submitted {formatDateTime(request.submittedAt)}
                          </span>
                        </span>
                        <span className={styles.status}>{formatStatus(request.status)}</span>
                      </li>
                    ))}
                  </ul>
                )}
          </QhdsCard>

          <QhdsCard heading="Recent activity">
            <ActivityList activity={summary.activity} />
          </QhdsCard>
        </div>
      </section>
    </QhdsLayout>
  );
}

export async function DashboardHomeContainer() {
  const [shell, summary] = await Promise.all([getDashboardShellData(), getDashboardSummaryData()]);

  return <DashboardContent shell={shell} summary={summary} />;
}
