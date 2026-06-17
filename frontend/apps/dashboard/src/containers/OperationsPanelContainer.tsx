import { getDashboardShellData, getOperationsPosture } from "@ssq/services/server";
import {
  QhdsCol,
  QhdsContentSection,
  QhdsFooter,
  QhdsHeader,
  QhdsIcon,
  QhdsLayout,
  QhdsPageAlert,
  QhdsPageHeader,
  QhdsRow,
  QhdsSideNav,
  QhdsSummaryList,
  QhdsTable
} from "@ssq/ui-library";

import styles from "./DashboardHomeContainer.module.scss";

import type { AppShellData } from "@ssq/services/server";
import type {
  PrototypeOperationsPosture,
  PrototypeOperationsPostureResult,
  PrototypeOperationsPostureStatus,
  PrototypeOperationsSignalStatus,
  PrototypeSessionSummary
} from "@ssq/services";

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

function formatBoolean(value: boolean): string {
  return value ? "Yes" : "No";
}

function formatOptionalNumber(value: number | undefined): string {
  return typeof value === "number" ? String(value) : "Unknown";
}

function getStatusClassName(status: PrototypeOperationsPostureStatus | PrototypeOperationsSignalStatus): string {
  if (status === "READY" || status === "OK") {
    return styles.statusPillOk;
  }

  if (status === "DEGRADED" || status === "WARN") {
    return styles.statusPillWarn;
  }

  return styles.statusPillFail;
}

function StatusPill({ status }: { status: PrototypeOperationsPostureStatus | PrototypeOperationsSignalStatus }) {
  return (
    <span className={`${styles.statusPill} ${getStatusClassName(status)}`}>
      {formatStatus(status)}
    </span>
  );
}

function OperationsSideNav({
  activeHref,
  session
}: {
  activeHref: string;
  session: PrototypeSessionSummary;
}) {
  const items = [
    {
      href: "/",
      icon: <QhdsIcon size="md" symbol="document" />,
      label: "Customer dashboard"
    },
    session.capabilities.canReviewSubmittedRequests
      ? {
          expanded: true,
          href: "/reviewer",
          icon: <QhdsIcon size="md" symbol="document" />,
          items: [
            { href: "/reviewer", label: "Reviewer queue" }
          ],
          label: "Staff review"
        }
      : undefined,
    session.capabilities.canReadOperations
      ? {
          href: "/operations",
          icon: <QhdsIcon size="md" symbol="document" />,
          label: "Operations"
        }
      : undefined
  ].filter((item): item is NonNullable<typeof item> => Boolean(item));

  return (
    <QhdsSideNav
      activeHref={activeHref}
      ariaLabel="Dashboard navigation"
      heading="Home"
      headingHref="/"
      headingIcon={<QhdsIcon size="md" symbol="home" />}
      items={items}
    />
  );
}

function AdminAccessRequired() {
  return (
    <QhdsPageAlert heading="Admin access required" tone="warning">
      <p>Use an admin demo role to review operations posture.</p>
    </QhdsPageAlert>
  );
}

function OperationsUnavailable({ result }: { result: PrototypeOperationsPostureResult }) {
  return (
    <QhdsPageAlert heading="Operations posture unavailable" tone="warning">
      <p>{result.error?.message ?? "Operations posture could not be loaded."}</p>
      {result.error?.code ? <p className={styles.meta}>Code: {result.error.code}</p> : null}
    </QhdsPageAlert>
  );
}

function SignalTable({ posture }: { posture: PrototypeOperationsPosture }) {
  const { signals } = posture;
  const rows = [
    {
      id: "runtime",
      signal: "Runtime",
      status: <StatusPill status={signals.runtime.status} />,
      summary: "Application runtime responded."
    },
    {
      id: "database",
      signal: "Database",
      status: <StatusPill status={signals.database.status} />,
      summary: "Database readiness check completed."
    },
    {
      id: "outbox",
      signal: "Outbox",
      status: <StatusPill status={signals.outbox.status} />,
      summary: signals.outbox.summary
        ? `${signals.outbox.summary.totals.pending} pending, ${signals.outbox.summary.totals.processed} processed, ${signals.outbox.summary.totals.failed} failed`
        : signals.outbox.error ?? "No outbox summary returned."
    },
    {
      id: "feature-flags",
      signal: "Feature flags",
      status: <StatusPill status={signals.featureFlags.status} />,
      summary: signals.featureFlags.error ?? `${signals.featureFlags.enabled} enabled, ${signals.featureFlags.disabled} disabled`
    },
    {
      id: "migrations",
      signal: "Migrations",
      status: <StatusPill status={signals.migrations.status} />,
      summary: signals.migrations.error
        ?? `${formatOptionalNumber(signals.migrations.appliedCount)} applied of ${formatOptionalNumber(signals.migrations.availableCount)} available`
    },
    {
      id: "hardening",
      signal: "Hardening",
      status: <StatusPill status={signals.hardening.status} />,
      summary: `Rate limit ${signals.hardening.rateLimitEnabled ? "enabled" : "disabled"}, debug routes ${signals.hardening.debugRoutesEnabled ? "enabled" : "disabled"}`
    },
    {
      id: "seeded-data",
      signal: "Seeded data",
      status: <StatusPill status={signals.seededData.status} />,
      summary: signals.seededData.error
        ?? `${formatOptionalNumber(signals.seededData.seedFileCount)} seed file(s), latest ${signals.seededData.latestAvailableSeed ?? "unknown"}`
    }
  ];

  return (
    <QhdsTable
      caption="Operations signals"
      columns={[
        { header: "Signal", key: "signal" },
        { header: "Status", key: "status" },
        { header: "Summary", key: "summary" }
      ]}
      rows={rows}
      striped
    />
  );
}

function OutboxTable({ posture }: { posture: PrototypeOperationsPosture }) {
  const summary = posture.signals.outbox.summary;

  if (!summary || summary.byEventType.length === 0) {
    return <p className={styles.empty}>No outbox events were returned.</p>;
  }

  return (
    <QhdsTable
      caption="Outbox event counts"
      columns={[
        { header: "Event type", key: "eventType" },
        { header: "Statuses", key: "statuses" }
      ]}
      rows={summary.byEventType.map((entry) => ({
        eventType: entry.eventType,
        id: entry.eventType,
        statuses: Object.entries(entry.statuses)
          .map(([status, count]) => `${formatStatus(status)}: ${count}`)
          .join(", ")
      }))}
      striped
    />
  );
}

function FeatureFlagTable({ posture }: { posture: PrototypeOperationsPosture }) {
  const flags = posture.signals.featureFlags.flags;

  if (flags.length === 0) {
    return <p className={styles.empty}>No feature flags were returned.</p>;
  }

  return (
    <QhdsTable
      caption="Feature flags"
      columns={[
        { header: "Flag", key: "flag" },
        { header: "State", key: "state" }
      ]}
      rows={flags.map((flag) => ({
        flag: flag.key,
        id: flag.key,
        state: flag.enabled ? "Enabled" : "Disabled"
      }))}
      striped
    />
  );
}

function NextActionsTable({ posture }: { posture: PrototypeOperationsPosture }) {
  if (posture.nextActions.length === 0) {
    return <p className={styles.empty}>No operations actions were returned.</p>;
  }

  return (
    <QhdsTable
      caption="Next actions"
      columns={[
        { header: "Severity", key: "severity" },
        { header: "Code", key: "code" },
        { header: "Message", key: "message" }
      ]}
      rows={posture.nextActions.map((action) => ({
        code: action.code,
        id: action.code,
        message: action.message,
        severity: formatStatus(action.severity)
      }))}
      striped
    />
  );
}

function OperationsPosture({ posture }: { posture: PrototypeOperationsPosture }) {
  const postureTone = posture.status === "READY" ? "success" : "warning";

  return (
    <>
      <QhdsPageAlert heading={`Operations ${formatStatus(posture.status)}`} tone={postureTone}>
        <p>Generated {formatDateTime(posture.generatedAt)}.</p>
      </QhdsPageAlert>

      <QhdsContentSection heading="Operations summary">
        <QhdsSummaryList
          ariaLabel="Operations summary"
          items={[
            { description: <StatusPill status={posture.status} />, term: "Posture" },
            { description: posture.service.name, term: "Backend service" },
            { description: posture.service.version, term: "Version" },
            { description: posture.service.environment, term: "Environment" },
            { description: formatDateTime(posture.generatedAt), term: "Generated" }
          ]}
        />
      </QhdsContentSection>

      <QhdsContentSection heading="System signals">
        <SignalTable posture={posture} />
      </QhdsContentSection>

      <QhdsContentSection heading="Operations detail">
        <QhdsRow className={styles.sectionGrid}>
          <QhdsCol lg={12} xl={6}>
            <QhdsSummaryList
              ariaLabel="Hardening posture"
              items={[
                { description: formatBoolean(posture.signals.hardening.rateLimitEnabled), term: "Rate limit enabled" },
                { description: String(posture.signals.hardening.rateLimitMax), term: "Rate limit max" },
                { description: `${posture.signals.hardening.rateLimitWindowMs} ms`, term: "Rate limit window" },
                { description: formatBoolean(posture.signals.hardening.debugRoutesEnabled), term: "Debug routes enabled" },
                { description: formatBoolean(posture.signals.hardening.hstsEnabled), term: "HSTS enabled" },
                { description: String(posture.signals.hardening.corsAllowedOrigins), term: "CORS allowed origins" }
              ]}
            />
          </QhdsCol>
          <QhdsCol lg={12} xl={6}>
            <QhdsSummaryList
              ariaLabel="Migration and seed posture"
              items={[
                { description: posture.signals.migrations.latestApplied ?? "Unknown", term: "Latest applied migration" },
                { description: posture.signals.migrations.latestAvailable ?? "Unknown", term: "Latest available migration" },
                { description: posture.signals.seededData.latestAvailableSeed ?? "Unknown", term: "Latest seed" },
                { description: formatOptionalNumber(posture.signals.seededData.seedFileCount), term: "Seed files" }
              ]}
            />
          </QhdsCol>
        </QhdsRow>
      </QhdsContentSection>

      <QhdsContentSection heading="Outbox">
        <QhdsSummaryList
          ariaLabel="Outbox totals"
          items={[
            { description: String(posture.signals.outbox.summary?.totals.pending ?? 0), term: "Pending" },
            { description: String(posture.signals.outbox.summary?.totals.processed ?? 0), term: "Processed" },
            { description: String(posture.signals.outbox.summary?.totals.failed ?? 0), term: "Failed" }
          ]}
        />
        <OutboxTable posture={posture} />
      </QhdsContentSection>

      <QhdsContentSection heading="Feature flags">
        <FeatureFlagTable posture={posture} />
      </QhdsContentSection>

      <QhdsContentSection heading="Next actions">
        <NextActionsTable posture={posture} />
      </QhdsContentSection>
    </>
  );
}

export function OperationsPanelContent({
  result,
  shell
}: {
  result?: PrototypeOperationsPostureResult;
  shell: AppShellData;
}) {
  const canReadOperations = shell.session.capabilities.canReadOperations;

  return (
    <QhdsLayout
      contentLabelledBy="page-title"
      footer={<QhdsFooter />}
      header={<QhdsHeader />}
      sideNav={<OperationsSideNav activeHref="/operations" session={shell.session} />}
    >
      <QhdsPageHeader
        aside={
          <QhdsSummaryList
            ariaLabel="Session summary"
            items={[
              { description: shell.session.displayName, term: "Signed in as" },
              { description: shell.session.subject, term: "Subject" },
              { description: shell.session.roles.join(", "), term: "Demo role" },
              { description: formatStatus(shell.session.identityStrength), term: "Identity" }
            ]}
          />
        }
        heading="Operations"
        headingId="page-title"
        lead="Review SSQ prototype service readiness and operational signals."
      />

      {!canReadOperations ? <AdminAccessRequired /> : null}
      {canReadOperations && result && !result.ok ? <OperationsUnavailable result={result} /> : null}
      {canReadOperations && result?.ok && result.posture ? <OperationsPosture posture={result.posture} /> : null}

      <span className={styles.meta}>Source: {shell.dataSource}</span>
    </QhdsLayout>
  );
}

export async function OperationsPanelContainer() {
  const shell = await getDashboardShellData();
  const result = shell.session.capabilities.canReadOperations ? await getOperationsPosture() : undefined;

  return <OperationsPanelContent result={result} shell={shell} />;
}
