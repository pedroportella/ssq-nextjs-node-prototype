import {
  getDashboardShellData,
  getReviewerQueueData,
  getReviewerRequestDetailData,
  resolveFrontendPublicUrlConfig
} from "@ssq/services/server";
import {
  QhdsButton,
  QhdsContentSection,
  QhdsFooter,
  QhdsHeader,
  QhdsIcon,
  QhdsLayout,
  QhdsPageAlert,
  QhdsPageHeader,
  QhdsSelect,
  QhdsSideNav,
  QhdsSummaryList,
  QhdsTable,
  QhdsTextInput,
  QhdsTextarea
} from "@ssq/ui-library";

import styles from "./DashboardHomeContainer.module.scss";

import type { AppShellData } from "@ssq/services/server";
import type {
  PrototypeReviewerQueueData,
  PrototypeReviewerQueueFilters,
  PrototypeReviewerRequestDetailData,
  PrototypeReviewerRequestSummary,
  PrototypeReviewerStatus,
  PrototypeSessionSummary,
  PrototypeUploadedDocument
} from "@ssq/services";

type SearchParams = Record<string, string | string[] | undefined>;

const statusOptions: Array<{ label: string; value: "" | PrototypeReviewerStatus }> = [
  { label: "All statuses", value: "" },
  { label: "Submitted", value: "SUBMITTED" },
  { label: "In review", value: "IN_REVIEW" },
  { label: "Action required", value: "ACTION_REQUIRED" },
  { label: "Approved", value: "APPROVED" }
];

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function isReviewerStatus(value: string | undefined): value is PrototypeReviewerStatus {
  return value === "SUBMITTED" || value === "IN_REVIEW" || value === "ACTION_REQUIRED" || value === "APPROVED";
}

export function parseReviewerQueueFilters(searchParams: SearchParams = {}): PrototypeReviewerQueueFilters {
  const page = Number(firstParam(searchParams.page) ?? "1");
  const search = firstParam(searchParams.search)?.trim();
  const status = firstParam(searchParams.status);

  return {
    page: Number.isInteger(page) && page > 0 ? page : 1,
    search: search || undefined,
    sortBy: "createdAt",
    sortDirection: "DESC",
    status: isReviewerStatus(status) ? status : undefined
  };
}

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

function ReviewerSideNav({
  activeHref,
  session
}: {
  activeHref: string;
  session: PrototypeSessionSummary;
}) {
  const staffItems = session.capabilities.canReviewSubmittedRequests
    ? [
        {
          expanded: true,
          href: "/reviewer",
          icon: <QhdsIcon size="md" symbol="document" />,
          items: [
            { href: "/reviewer", label: "Reviewer queue" }
          ],
          label: "Staff review"
        }
      ]
    : [];

  return (
    <QhdsSideNav
      activeHref={activeHref}
      ariaLabel="Dashboard navigation"
      heading="Home"
      headingHref="/"
      headingIcon={<QhdsIcon size="md" symbol="home" />}
      items={[
        {
          href: "/",
          icon: <QhdsIcon size="md" symbol="document" />,
          label: "Customer dashboard"
        },
        ...staffItems
      ]}
    />
  );
}

function AccessDenied() {
  return (
    <QhdsPageAlert heading="Staff access required" tone="warning">
      <p>Use a service officer, team lead or admin demo role to review submitted records.</p>
    </QhdsPageAlert>
  );
}

function QueueFilterForm({ filters }: { filters: PrototypeReviewerQueueFilters }) {
  return (
    <form action="/reviewer" className={styles.filterForm} method="get">
      <QhdsTextInput
        defaultValue={filters.search ?? ""}
        id="reviewer-search"
        label="Search queue"
        name="search"
      />
      <QhdsSelect
        defaultValue={filters.status ?? ""}
        id="reviewer-status"
        label="Status"
        name="status"
        options={statusOptions}
      />
      <div className={styles.formActions}>
        <QhdsButton type="submit">Apply filters</QhdsButton>
        <QhdsButton href="/reviewer" variant="tertiary">Clear</QhdsButton>
      </div>
    </form>
  );
}

function StatusCounts({ queue }: { queue: PrototypeReviewerQueueData }) {
  if (queue.statusCounts.length === 0) {
    return <p className={styles.empty}>No submitted requests match the current filters.</p>;
  }

  return (
    <QhdsSummaryList
      ariaLabel="Reviewer queue status counts"
      items={queue.statusCounts.map((item) => ({
        description: String(item.count),
        term: formatStatus(item.status)
      }))}
    />
  );
}

function assignedLabel(request: PrototypeReviewerRequestSummary) {
  return request.assignedOfficerSubject || request.assignedTeam || "Unassigned";
}

function QueueTable({ queue }: { queue: PrototypeReviewerQueueData }) {
  if (queue.requests.length === 0) {
    return <p className={styles.empty}>No submitted requests found.</p>;
  }

  return (
    <QhdsTable
      caption="Submitted request queue"
      columns={[
        { header: "Select", key: "select" },
        { header: "Request", key: "request" },
        { header: "Status", key: "status" },
        { header: "Assigned", key: "assigned" },
        { header: "Submitted", key: "submitted" }
      ]}
      rows={queue.requests.map((request) => ({
        assigned: (
          <>
            {assignedLabel(request)}
            {request.lastTouchedBy ? <span className={styles.meta}>Touched by {request.lastTouchedBy}</span> : null}
          </>
        ),
        id: request.referenceNumber,
        request: (
          <>
            <a href={`/reviewer/${encodeURIComponent(request.referenceNumber)}`}>
              <strong>{request.title}</strong>
            </a>
            <span className={styles.meta}>{request.referenceNumber}</span>
          </>
        ),
        select: (
          <input
            aria-label={`Select ${request.referenceNumber}`}
            form="reviewer-batch-form"
            name="referenceNumbers"
            type="checkbox"
            value={request.referenceNumber}
          />
        ),
        status: formatStatus(request.status),
        submitted: formatDateTime(request.submittedAt)
      }))}
      striped
    />
  );
}

function BatchActionForm({ queue }: { queue: PrototypeReviewerQueueData }) {
  const disabled = queue.requests.length === 0;

  return (
    <form action="/reviewer/actions/batch-status" className={styles.actionPanel} id="reviewer-batch-form" method="post">
      <h3 className={styles.panelHeading}>Batch transition</h3>
      <QhdsSelect
        disabled={disabled}
        id="batch-status"
        label="Move selected requests to"
        name="status"
        options={[{ label: "In review", value: "IN_REVIEW" }]}
      />
      <QhdsTextarea
        disabled={disabled}
        hint="Required for audit history."
        id="batch-reason"
        label="Reason"
        name="reason"
        required
      />
      <QhdsButton disabled={disabled} type="submit">Apply to selected</QhdsButton>
    </form>
  );
}

function documentHref(document: PrototypeUploadedDocument, request: PrototypeReviewerRequestSummary) {
  if (!document.downloadHref) {
    return undefined;
  }

  if (document.downloadHref.startsWith("http://") || document.downloadHref.startsWith("https://")) {
    return document.downloadHref;
  }

  const publicUrls = resolveFrontendPublicUrlConfig();

  return `${publicUrls[request.appKey]}${document.downloadHref}`;
}

function SupportingDocumentList({ detail }: { detail: PrototypeReviewerRequestDetailData }) {
  if (!detail.request || detail.supportingDocuments.length === 0) {
    return <p className={styles.empty}>No supporting documents are attached.</p>;
  }

  return (
    <ul className={styles.fileList}>
      {detail.supportingDocuments.map((document) => {
        const href = documentHref(document, detail.request as PrototypeReviewerRequestSummary);

        return (
          <li className={styles.fileListItem} key={`${document.id ?? document.fileName}`}>
            {href ? <a href={href}>{document.fileName}</a> : <span>{document.fileName}</span>}
            <span className={styles.meta}>{document.category}</span>
          </li>
        );
      })}
    </ul>
  );
}

function AssignmentForm({ request }: { request: PrototypeReviewerRequestSummary }) {
  return (
    <form action="/reviewer/actions/assign" className={styles.actionPanel} method="post">
      <input name="referenceNumber" type="hidden" value={request.referenceNumber} />
      <h3 className={styles.panelHeading}>Assignment</h3>
      <QhdsTextInput
        defaultValue={request.assignedOfficerSubject ?? ""}
        id="assigned-officer-subject"
        label="Assigned officer"
        name="assignedOfficerSubject"
      />
      <QhdsTextInput
        defaultValue={request.assignedTeam ?? ""}
        id="assigned-team"
        label="Assigned team"
        name="assignedTeam"
      />
      <QhdsTextarea
        hint="Required for audit history."
        id="assignment-reason"
        label="Reason"
        name="reason"
        required
      />
      <QhdsButton type="submit">Save assignment</QhdsButton>
    </form>
  );
}

export function ReviewerQueueContent({ queue, shell }: { queue: PrototypeReviewerQueueData; shell: AppShellData }) {
  return (
    <QhdsLayout
      contentLabelledBy="page-title"
      footer={<QhdsFooter />}
      header={<QhdsHeader />}
      sideNav={<ReviewerSideNav activeHref="/reviewer" session={shell.session} />}
    >
      <QhdsPageHeader
        aside={
          <QhdsSummaryList
            ariaLabel="Reviewer identity"
            items={[
              { description: queue.reviewerRole, term: "Role" },
              { description: queue.reviewerSubject, term: "Signed in as" }
            ]}
          />
        }
        heading="Reviewer queue"
        headingId="page-title"
        lead="Search, filter and triage submitted SSQ service requests."
      />

      {!queue.canReview ? <AccessDenied /> : null}

      {queue.canReview ? (
        <>
          <QhdsContentSection heading="Filters" id="reviewer-filters">
            <QueueFilterForm filters={queue.filters} />
          </QhdsContentSection>

          <QhdsContentSection heading="Queue summary" id="queue-summary">
            <StatusCounts queue={queue} />
          </QhdsContentSection>

          <QhdsContentSection heading="Submitted requests" id="submitted-requests">
            <p className={styles.meta}>
              Showing {queue.requests.length} of {queue.pageInfo.totalItems} request{queue.pageInfo.totalItems === 1 ? "" : "s"}.
            </p>
            <QueueTable queue={queue} />
            <BatchActionForm queue={queue} />
          </QhdsContentSection>
        </>
      ) : null}

      <span className={styles.meta}>Source: {shell.dataSource}</span>
    </QhdsLayout>
  );
}

export function ReviewerRequestDetailContent({
  detail,
  shell
}: {
  detail: PrototypeReviewerRequestDetailData;
  shell: AppShellData;
}) {
  const request = detail.request;

  return (
    <QhdsLayout
      contentLabelledBy="page-title"
      footer={<QhdsFooter />}
      header={<QhdsHeader />}
      sideNav={<ReviewerSideNav activeHref="/reviewer" session={shell.session} />}
    >
      <QhdsPageHeader
        aside={
          request ? (
            <QhdsSummaryList
              ariaLabel="Request status"
              items={[
                { description: request.referenceNumber, term: "Reference" },
                { description: formatStatus(request.status), term: "Status" },
                { description: assignedLabel(request), term: "Assigned" }
              ]}
            />
          ) : undefined
        }
        heading={request ? request.title : "Request not found"}
        headingId="page-title"
        lead={request ? "Review submitted request details and supporting evidence." : "The requested record could not be found."}
      />

      {!detail.canReview ? <AccessDenied /> : null}

      {detail.canReview && request ? (
        <>
          <QhdsContentSection heading="Request details" id="request-details">
            <QhdsSummaryList
              ariaLabel="Submitted request details"
              items={[
                { description: request.referenceNumber, term: "Reference" },
                { description: formatStatus(request.status), term: "Status" },
                { description: formatDateTime(request.submittedAt), term: "Submitted" },
                { description: assignedLabel(request), term: "Assigned" }
              ]}
            />
          </QhdsContentSection>

          <QhdsContentSection heading="Payload summary" id="payload-summary">
            {detail.payloadItems.length > 0 ? (
              <QhdsSummaryList
                ariaLabel="Request payload"
                items={detail.payloadItems.map((item) => ({
                  description: item.value,
                  term: item.label
                }))}
              />
            ) : (
              <p className={styles.empty}>No payload fields were saved.</p>
            )}
          </QhdsContentSection>

          <QhdsContentSection heading="Supporting documents" id="supporting-documents">
            <SupportingDocumentList detail={detail} />
          </QhdsContentSection>

          <QhdsContentSection heading="Reviewer actions" id="reviewer-actions">
            <AssignmentForm request={request} />
          </QhdsContentSection>

          <QhdsContentSection heading="Activity history" id="activity-history">
            {detail.activity.length > 0 ? (
              <QhdsTable
                caption="Request activity history"
                columns={[
                  { header: "Activity", key: "activity" },
                  { header: "Date", key: "date" }
                ]}
                rows={detail.activity.map((entry, index) => ({
                  activity: entry.description,
                  date: formatDateTime(entry.at),
                  id: `${entry.at}-${index}`
                }))}
                striped
              />
            ) : (
              <p className={styles.empty}>No activity has been recorded.</p>
            )}
          </QhdsContentSection>
        </>
      ) : null}

      <div className={styles.sectionActions}>
        <QhdsButton href="/reviewer" variant="secondary">Back to reviewer queue</QhdsButton>
      </div>
      <span className={styles.meta}>Source: {shell.dataSource}</span>
    </QhdsLayout>
  );
}

export async function ReviewerQueueContainer({ searchParams = {} }: { searchParams?: SearchParams }) {
  const filters = parseReviewerQueueFilters(searchParams);
  const [shell, queue] = await Promise.all([
    getDashboardShellData(),
    getReviewerQueueData(filters)
  ]);
  const queueForSession = {
    ...queue,
    canReview: shell.session.capabilities.canReviewSubmittedRequests,
    reviewerRole: shell.session.roles[0] ?? queue.reviewerRole,
    reviewerSubject: shell.session.subject
  };

  return <ReviewerQueueContent queue={queueForSession} shell={shell} />;
}

export async function ReviewerRequestDetailContainer({ referenceNumber }: { referenceNumber: string }) {
  const [shell, detail] = await Promise.all([
    getDashboardShellData(),
    getReviewerRequestDetailData(referenceNumber)
  ]);
  const detailForSession = {
    ...detail,
    canReview: shell.session.capabilities.canReviewSubmittedRequests,
    reviewerRole: shell.session.roles[0] ?? detail.reviewerRole,
    reviewerSubject: shell.session.subject
  };

  return <ReviewerRequestDetailContent detail={detailForSession} shell={shell} />;
}
