"use client";

import {
  QhdsAccordion,
  QhdsButton,
  QhdsCard,
  QhdsCategorizedFileUpload,
  QhdsCheckbox,
  QhdsCol,
  QhdsContentSection,
  QhdsFileUpload,
  QhdsFooter,
  QhdsHeader,
  QhdsIcon,
  QhdsLayout,
  QhdsPageAlert,
  QhdsPageHeader,
  QhdsProgressIndicator,
  QhdsRadioGroup,
  QhdsRow,
  QhdsSelect,
  QhdsSideNav,
  QhdsSummaryList,
  QhdsTable,
  QhdsTabs,
  QhdsTextInput,
  QhdsTextarea
} from "@ssq/ui-library";

import styles from "./UILibraryShowcaseContainer.module.scss";

const uploadPolicy = {
  acceptedFileTypes: ["application/pdf", "image/jpeg", "image/png"],
  maxFileSizeBytes: 5 * 1024 * 1024,
  maxFilesPerPerson: 5,
  maxTotalSizeBytesPerPerson: 10 * 1024 * 1024
};

const uploadCategories = [
  { hint: "Identity and age evidence.", label: "Identity evidence", value: "identity" },
  { hint: "Current address evidence.", label: "Residency evidence", value: "residency" },
  { hint: "Income or tenancy evidence.", label: "Supporting evidence", value: "supporting-evidence" }
];

function DocumentButtonIcon() {
  return (
    <svg className={styles.buttonIcon} focusable="false" viewBox="0 0 24 24">
      <path d="M7 3h7l4 4v14H7V3Z" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="2" />
      <path d="M14 3v5h4" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  );
}

function ShowcaseSideNav() {
  return (
    <QhdsSideNav
      activeHref="/ui-library"
      ariaLabel="UI Library showcase navigation"
      heading="UI Library"
      headingHref="/ui-library"
      headingIcon={<QhdsIcon size="md" symbol="document" />}
      items={[
        { href: "#alerts-actions", icon: <QhdsIcon size="md" symbol="document" />, label: "Alerts and actions" },
        { href: "#forms", icon: <QhdsIcon size="md" symbol="document" />, label: "Form states" },
        { href: "#uploads", icon: <QhdsIcon size="md" symbol="document" />, label: "Upload states" },
        { href: "#navigation", icon: <QhdsIcon size="md" symbol="document" />, label: "Navigation" },
        { href: "#data-display", icon: <QhdsIcon size="md" symbol="document" />, label: "Data display" },
        { href: "#workflow", icon: <QhdsIcon size="md" symbol="clock" />, label: "Workflow" }
      ]}
    />
  );
}

function AlertsAndActions() {
  return (
    <QhdsContentSection heading="Alerts and actions" id="alerts-actions">
      <div className={styles.componentGrid}>
        <div className={styles.componentStack}>
          <QhdsPageAlert heading="Information" tone="info">
            <p>Reference data has been loaded for review.</p>
          </QhdsPageAlert>
          <QhdsPageAlert heading="Success" tone="success">
            <p>The request was submitted and queued.</p>
          </QhdsPageAlert>
          <QhdsPageAlert heading="Warning" tone="warning">
            <p>Evidence is missing a required category.</p>
          </QhdsPageAlert>
        </div>
        <div className={styles.componentPanel}>
          <h3 className={styles.panelHeading}>Buttons</h3>
          <div className={styles.panelActions}>
            <QhdsButton>Primary action</QhdsButton>
            <QhdsButton variant="secondary">Secondary action</QhdsButton>
            <QhdsButton variant="tertiary">Tertiary action</QhdsButton>
            <QhdsButton disabled>Disabled action</QhdsButton>
            <QhdsButton leadingIcon={<DocumentButtonIcon />}>Icon action</QhdsButton>
          </div>
        </div>
      </div>
    </QhdsContentSection>
  );
}

function Forms() {
  return (
    <QhdsContentSection heading="Form states" id="forms">
      <QhdsRow className={styles.showcaseGrid}>
        <QhdsCol lg={6}>
          <div className={styles.componentPanel}>
            <h3 className={styles.panelHeading}>Text and select controls</h3>
            <QhdsTextInput
              defaultValue="Avery Taylor"
              hint="Read-only customer profile value."
              id="showcase-full-name"
              label="Full name"
              readOnly
              required
            />
            <QhdsTextInput
              error="Enter a date in YYYY-MM-DD format."
              hint="Use a valid eligibility date."
              id="showcase-date-of-birth"
              label="Date of birth"
              required
              type="date"
            />
            <QhdsTextInput
              disabled
              id="showcase-disabled-input"
              label="Disabled input"
              value="Locked value"
            />
            <QhdsSelect
              defaultValue="qld"
              id="showcase-residential-state"
              label="Residential state"
              options={[
                { label: "Queensland", value: "qld" },
                { label: "Other Australian state or territory", value: "other" }
              ]}
            />
            <QhdsTextarea
              defaultValue="Applicant has supplied tenancy details for review."
              id="showcase-notes"
              label="Assessment note"
              optional
            />
          </div>
        </QhdsCol>
        <QhdsCol lg={6}>
          <div className={styles.componentPanel}>
            <h3 className={styles.panelHeading}>Choice controls</h3>
            <QhdsRadioGroup
              defaultValue="private-rental"
              id="showcase-housing-situation"
              legend="Housing situation"
              name="showcaseHousingSituation"
              options={[
                { hint: "Applicant rents from a private owner or agent.", label: "Private rental", value: "private-rental" },
                { hint: "Applicant is moving from supported accommodation.", label: "Supported accommodation", value: "supported-accommodation" }
              ]}
              required
            />
            <QhdsRadioGroup
              disabled
              defaultValue="yes"
              id="showcase-disabled-radio"
              legend="Disabled radio group"
              name="showcaseDisabledRadio"
              options={[
                { label: "Yes", value: "yes" },
                { label: "No", value: "no" }
              ]}
            />
            <QhdsCheckbox
              defaultChecked
              id="showcase-declaration"
              label="I declare this prototype information is ready for review."
              name="showcaseDeclaration"
              required
            />
            <QhdsCheckbox
              disabled
              id="showcase-disabled-checkbox"
              label="Disabled checkbox"
              name="showcaseDisabledCheckbox"
            />
          </div>
        </QhdsCol>
      </QhdsRow>
    </QhdsContentSection>
  );
}

function Uploads() {
  return (
    <QhdsContentSection heading="Upload states" id="uploads">
      <QhdsRow className={styles.showcaseGrid}>
        <QhdsCol lg={6}>
          <div className={styles.componentPanel}>
            <h3 className={styles.panelHeading}>Categorized upload</h3>
            <QhdsCategorizedFileUpload
              categories={uploadCategories}
              hint="Files are grouped by person and category."
              id="showcase-categorized-upload"
              label="Upload evidence by person"
              name="showcaseEvidence"
              people={[
                { hint: "Primary applicant evidence.", key: "applicant", label: "Avery Taylor" },
                { hint: "Household evidence.", key: "household-member", label: "Household member" }
              ]}
              policy={uploadPolicy}
              value={[
                {
                  category: "identity",
                  fileName: "identity-evidence.pdf",
                  id: "showcase-identity-evidence",
                  mimeType: "application/pdf",
                  personKey: "applicant",
                  sizeBytes: 512_000,
                  status: "staged"
                },
                {
                  fileName: "oversized-income-evidence.pdf",
                  id: "showcase-oversized-income",
                  mimeType: "application/pdf",
                  personKey: "household-member",
                  sizeBytes: 6 * 1024 * 1024,
                  status: "rejected"
                }
              ]}
            />
          </div>
        </QhdsCol>
        <QhdsCol lg={6}>
          <div className={styles.componentPanel}>
            <h3 className={styles.panelHeading}>Uploaded files</h3>
            <QhdsFileUpload
              error="Upload a PDF, JPG or PNG file under 5.0 MB."
              hint="Completed uploads can expose download links."
              id="showcase-uploaded-files"
              label="Supporting documents"
              multiple
              name="showcaseUploadedFiles"
              policy={uploadPolicy}
              uploadedFiles={[
                {
                  category: "Identity evidence",
                  downloadHref: "#identity-document",
                  fileName: "identity-evidence.pdf",
                  sizeBytes: 512_000,
                  status: "uploaded"
                },
                {
                  category: "Income evidence",
                  fileName: "income-evidence.zip",
                  message: "ZIP files are not accepted.",
                  sizeBytes: 384_000,
                  status: "rejected"
                }
              ]}
            />
          </div>
        </QhdsCol>
      </QhdsRow>
    </QhdsContentSection>
  );
}

function NavigationAndDisclosure() {
  return (
    <QhdsContentSection heading="Navigation and disclosure" id="navigation">
      <QhdsRow className={styles.showcaseGrid}>
        <QhdsCol lg={6}>
          <div className={styles.componentPanel}>
            <h3 className={styles.panelHeading}>Tabs</h3>
            <QhdsTabs
              defaultSelectedId="tab-ready"
              items={[
                {
                  id: "tab-ready",
                  label: "Ready",
                  panel: <p>Ready requests have passed validation and can be submitted.</p>
                },
                {
                  id: "tab-action",
                  label: "Action required",
                  panel: <p>Action-required requests need updated evidence before review.</p>
                }
              ]}
              label="Request state tabs"
            />
          </div>
        </QhdsCol>
        <QhdsCol lg={6}>
          <div className={styles.componentPanel}>
            <h3 className={styles.panelHeading}>Accordion</h3>
            <QhdsAccordion
              headingLevel={3}
              items={[
                {
                  content: <p>Applicants can attach identity, residency and income documents.</p>,
                  defaultOpen: true,
                  id: "showcase-evidence-details",
                  title: "Evidence details"
                },
                {
                  content: <p>Reviewers can use the queue to assign and transition submitted records.</p>,
                  id: "showcase-review-details",
                  title: "Reviewer details"
                }
              ]}
            />
          </div>
        </QhdsCol>
      </QhdsRow>
    </QhdsContentSection>
  );
}

function DataDisplay() {
  return (
    <QhdsContentSection heading="Data display" id="data-display">
      <QhdsRow className={styles.showcaseGrid}>
        <QhdsCol lg={6}>
          <div className={styles.componentPanel}>
            <h3 className={styles.panelHeading}>Summary and card</h3>
            <QhdsSummaryList
              ariaLabel="Example request summary"
              items={[
                { description: "SC-2026-0001", term: "Reference" },
                { description: "In review", term: "Status" },
                { description: "Avery Taylor", term: "Applicant" }
              ]}
            />
            <QhdsCard
              action={<QhdsButton href="#card-action" variant="secondary">Open request</QhdsButton>}
              heading="Seniors Card"
            >
              <p>Card presentation for a single service entry.</p>
            </QhdsCard>
          </div>
        </QhdsCol>
        <QhdsCol lg={6}>
          <div className={styles.componentPanel}>
            <h3 className={styles.panelHeading}>Table and empty state</h3>
            <QhdsTable
              caption="Submitted requests"
              columns={[
                { header: "Reference", key: "reference" },
                { header: "Status", key: "status" },
                { header: "Files", key: "files" }
              ]}
              rows={[
                { files: "1 uploaded", id: "SC-2026-0001", reference: "SC-2026-0001", status: "Approved" },
                { files: "2 uploaded", id: "RSS-2026-0001", reference: "RSS-2026-0001", status: "In review" }
              ]}
              striped
            />
            <p className={styles.muted}>No submitted requests found.</p>
          </div>
        </QhdsCol>
      </QhdsRow>
    </QhdsContentSection>
  );
}

function WorkflowStates() {
  return (
    <QhdsContentSection heading="Workflow states" id="workflow">
      <QhdsRow className={styles.showcaseGrid}>
        <QhdsCol lg={6}>
          <div className={styles.componentPanel}>
            <h3 className={styles.panelHeading}>Progress indicator</h3>
            <QhdsProgressIndicator
              label="Example workflow progress"
              steps={[
                { id: "about-you", label: "About you", status: "completed" },
                { id: "evidence", label: "Evidence", status: "current" },
                { id: "review", label: "Review", status: "upcoming" }
              ]}
            />
          </div>
        </QhdsCol>
        <QhdsCol lg={6}>
          <div className={styles.componentPanel}>
            <h3 className={styles.panelHeading}>Loading</h3>
            <div aria-busy="true" className={styles.loadingRegion} role="status">
              <span aria-hidden="true" className={styles.loadingDot} />
              <span>Loading component state.</span>
            </div>
          </div>
        </QhdsCol>
      </QhdsRow>
    </QhdsContentSection>
  );
}

export function UILibraryShowcaseContent() {
  return (
    <QhdsLayout
      contentLabelledBy="page-title"
      footer={<QhdsFooter />}
      header={<QhdsHeader />}
      sideNav={<ShowcaseSideNav />}
    >
      <QhdsPageHeader
        heading="UI Library showcase"
        headingId="page-title"
        lead="Reference states for SSQ's QHDS-style UI library."
      />
      <div className={styles.showcaseGrid}>
        <AlertsAndActions />
        <Forms />
        <Uploads />
        <NavigationAndDisclosure />
        <DataDisplay />
        <WorkflowStates />
      </div>
    </QhdsLayout>
  );
}

export function UILibraryShowcaseContainer() {
  return <UILibraryShowcaseContent />;
}
