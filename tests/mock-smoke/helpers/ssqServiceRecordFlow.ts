import { expect, type Page, type TestInfo } from "@playwright/test";
import { generateBttfSsqApplicantData, type BttfSsqApplicant, type SsqServiceApp } from "./bttfSsqData";

export type SsqRecordSubmitMode = "submit" | "stop-before-submit";

export interface SeniorsCardScenarioFields {
  ageEligible?: "no" | "yes";
  dateOfBirth?: string;
  declaration?: boolean;
  residentialState?: "other" | "qld";
}

export interface RentalSecuritySubsidyScenarioFields {
  declaration?: boolean;
  housingSituation?: "private-rental" | "supported-accommodation";
  supportType?: "bond" | "subsidy";
  weeklyRent?: string;
}

export interface SsqWorkflowScenarioFields {
  "rental-security-subsidy"?: RentalSecuritySubsidyScenarioFields;
  "seniors-card"?: SeniorsCardScenarioFields;
}

export interface SsqRecordFlowOptions {
  applicant?: BttfSsqApplicant;
  submitMode: SsqRecordSubmitMode;
  testInfo?: TestInfo;
  withFiles?: boolean;
}

export interface SsqUploadValidationFile {
  body?: string;
  mimeType?: string;
  name: string;
  sizeBytes?: number;
}

interface EvidenceUploadConfig {
  category: string;
  dashboardHref?: string;
  inputSelector: string;
  savedFileName: string;
  stagedFileName: (applicant: BttfSsqApplicant) => string;
}

interface ServiceFlowConfig {
  applyHeading: string;
  applyUrl: string;
  dashboardUrl: string;
  evidence: EvidenceUploadConfig[];
  landingHeading: string;
  landingUrl: string;
  referenceNumber: string;
  serviceLabel: string;
  statusUrl: string;
  statusHeading: string;
}

const forbiddenRequestPatterns = [/localhost:7001/, /127\.0\.0\.1:7001/, /backend:7001/, /\/graphql(?:\?|$)/];

const serviceConfigs: Record<SsqServiceApp, ServiceFlowConfig> = {
  "rental-security-subsidy": {
    applyHeading: "Prepare your rental support application",
    applyUrl: "http://localhost:3002/apply",
    dashboardUrl: "http://localhost:3000",
    evidence: [
      {
        category: "supporting-evidence",
        dashboardHref: "http://localhost:3002/service-requests/RSS-2026-0001/supporting-documents/mock-rss-rental-evidence/download",
        inputSelector: "#rental-evidence-applicant-upload",
        savedFileName: "rental-property-evidence.pdf",
        stagedFileName: (applicant) => `rental-property-evidence-${applicant.safeId}.pdf`
      },
      {
        category: "income",
        dashboardHref: "http://localhost:3002/service-requests/RSS-2026-0001/supporting-documents/mock-rss-income-evidence/download",
        inputSelector: "#rental-evidence-household-member-upload",
        savedFileName: "household-income-evidence.pdf",
        stagedFileName: (applicant) => `household-income-evidence-${applicant.safeId}.pdf`
      }
    ],
    landingHeading: "Rental Security Subsidy",
    landingUrl: "http://localhost:3002",
    referenceNumber: "RSS-2026-0001",
    serviceLabel: "Rental Security Subsidy",
    statusUrl: "http://localhost:3002/application-status",
    statusHeading: "Rental Security Subsidy application status"
  },
  "seniors-card": {
    applyHeading: "Check your eligibility",
    applyUrl: "http://localhost:3001/apply",
    dashboardUrl: "http://localhost:3000",
    evidence: [
      {
        category: "identity",
        dashboardHref: "http://localhost:3001/service-requests/SC-2026-0001/supporting-documents/mock-sc-identity-evidence/download",
        inputSelector: "#supporting-evidence-applicant-upload",
        savedFileName: "identity-evidence.pdf",
        stagedFileName: (applicant) => `identity-evidence-${applicant.safeId}.pdf`
      }
    ],
    landingHeading: "Seniors Card",
    landingUrl: "http://localhost:3001",
    referenceNumber: "SC-2026-0001",
    serviceLabel: "Seniors Card",
    statusUrl: "http://localhost:3001/application-status",
    statusHeading: "Seniors Card application status"
  }
};

function createPdfFile(name: string, body: string) {
  return createFilePayload({
    body,
    mimeType: "application/pdf",
    name
  });
}

function createFilePayload({
  body,
  mimeType = "application/pdf",
  name,
  sizeBytes
}: SsqUploadValidationFile) {
  const content = Buffer.from(`%PDF-1.4\n${body ?? `SSQ scenario evidence: ${name}`}\n%%EOF`);
  const buffer = sizeBytes && sizeBytes > content.length
    ? Buffer.concat([content, Buffer.alloc(sizeBytes - content.length, "\n")])
    : content;

  return {
    buffer,
    mimeType,
    name
  };
}

export class SsqServiceRecordFlow {
  readonly applicant: BttfSsqApplicant;
  readonly config: ServiceFlowConfig;
  readonly forbiddenRequests: string[] = [];
  readonly page: Page;
  readonly service: SsqServiceApp;

  constructor(page: Page, service: SsqServiceApp, applicant = generateBttfSsqApplicantData(service)) {
    this.applicant = applicant;
    this.config = serviceConfigs[service];
    this.page = page;
    this.service = service;

    this.page.on("request", (request) => {
      const url = request.url();

      if (forbiddenRequestPatterns.some((pattern) => pattern.test(url))) {
        this.forbiddenRequests.push(url);
      }
    });
  }

  async attachGeneratedData(testInfo?: TestInfo) {
    if (!testInfo) {
      return;
    }

    await testInfo.attach(`${this.service}-bttf-applicant.json`, {
      body: JSON.stringify(this.applicant, null, 2),
      contentType: "application/json"
    });
  }

  async startApply() {
    await this.page.goto(this.config.applyUrl);
    await expect(this.page.getByRole("heading", { level: 1, name: this.config.applyHeading })).toBeVisible();
  }

  async startApplyFromLanding() {
    await this.page.goto(this.config.landingUrl);
    await expect(this.page.getByRole("heading", { level: 1, name: this.config.landingHeading })).toBeVisible();
    await this.page.locator("#start-application").getByRole("link", { name: "Start application" }).click();
    await expect(this.page).toHaveURL(this.config.applyUrl);
    await expect(this.page.getByRole("heading", { level: 1, name: this.config.applyHeading })).toBeVisible();
  }

  async stageEvidenceFiles() {
    for (const evidence of this.config.evidence) {
      await this.uploadCategorizedFile(evidence);
    }

    await expect(this.page.locator(".ssq-categorized-upload__item--staged")).toHaveCount(this.config.evidence.length);
  }

  async completeWorkflowFields(fields: SsqWorkflowScenarioFields = {}) {
    if (this.service === "seniors-card") {
      await this.completeSeniorsCardFields(fields["seniors-card"] ?? {});

      return;
    }

    await this.completeRentalSecuritySubsidyFields(fields["rental-security-subsidy"] ?? {});
  }

  async expectVisibleValidationMessages(messages: string[]) {
    for (const message of messages) {
      await expect(this.page.getByText(message).first()).toBeVisible();
    }

    if (messages.some((message) => message.includes("date of birth"))) {
      await expect(this.page.locator("#date-of-birth")).toHaveAttribute("aria-invalid", "true");
    }

    if (messages.some((message) => message.includes("weekly rent"))) {
      await expect(this.page.locator("#weekly-rent")).toHaveAttribute("aria-invalid", "true");
    }
  }

  async stageValidationFiles(inputSelector: string, files: SsqUploadValidationFile[]) {
    const input = this.page.locator(inputSelector);

    await expect(input).toHaveAttribute("type", "file");
    await input.setInputFiles(files.map((file) => createFilePayload(file)));

    for (const file of files) {
      await expect(this.page.locator(".ssq-categorized-upload__file-name", { hasText: file.name }).first()).toBeVisible();
    }
  }

  async chooseCategoryForFile(fileName: string, category: string) {
    const categorySelect = this.page.getByLabel(`Category for ${fileName}`);

    await categorySelect.selectOption(category);
    await expect(categorySelect).toHaveValue(category);
  }

  async expectUploadValidationMessages(messages: string[]) {
    for (const message of messages) {
      await expect(this.page.getByText(message).first()).toBeVisible();
    }
  }

  async expectReadyToSubmit() {
    await expect(this.page.locator("form.qld__form")).toContainText(this.config.referenceNumber);
    await expect(this.page.getByRole("link", { name: "Review submission" })).toBeVisible();
  }

  async stopBeforeSubmit() {
    await this.expectReadyToSubmit();
    await expect(this.page).toHaveURL(/\/apply$/);
  }

  async submitAndExpectSubmittedRecord() {
    await this.expectReadyToSubmit();
    await this.page.getByRole("link", { name: "Review submission" }).click();
    await expect(this.page).toHaveURL(/\/application-status$/);
    await expect(this.page.getByRole("heading", { level: 1, name: this.config.statusHeading })).toBeVisible();
    await expect(this.page.getByRole("heading", { name: "Application submitted" }).locator("xpath=ancestor::aside")).toContainText(
      this.config.referenceNumber
    );

    for (const evidence of this.config.evidence) {
      await expect(this.page.getByText(evidence.savedFileName)).toBeVisible();
    }

    await expect(this.page.locator(".ssq-file-upload__item--uploaded")).toHaveCount(this.config.evidence.length);
  }

  async expectSummaryDownload() {
    const downloadLink = this.page.getByRole("link", { name: "Download submission summary" });

    await expect(downloadLink).toHaveAttribute("href", `/service-requests/${this.config.referenceNumber}/summary/download`);

    const response = await this.page.request.get(new URL(
      `/service-requests/${this.config.referenceNumber}/summary/download`,
      this.config.statusUrl
    ).toString());

    expect(response.ok()).toBe(true);
    expect(await response.text()).toContain(`Reference: ${this.config.referenceNumber}`);
  }

  async openDashboardAndExpectSubmittedRecordWithFiles() {
    await this.page.goto(`${this.config.dashboardUrl}#submitted-requests`);
    await expect(this.page.getByRole("heading", { level: 1, name: "SSQ Service Dashboard" })).toBeVisible();

    const submittedRequests = this.page.locator("#submitted-requests");

    await expect(submittedRequests.getByRole("link", { name: this.config.serviceLabel })).toHaveAttribute(
      "href",
      this.config.statusUrl
    );
    await expect(submittedRequests).toContainText(this.config.referenceNumber);

    for (const evidence of this.config.evidence) {
      await expect(submittedRequests.getByRole("link", { name: evidence.savedFileName })).toHaveAttribute(
        "href",
        evidence.dashboardHref ?? `${this.config.statusUrl}#supporting-documents`
      );
    }
  }

  async run(options: SsqRecordFlowOptions) {
    await this.attachGeneratedData(options.testInfo);
    await this.startApply();

    if (options.withFiles ?? true) {
      await this.stageEvidenceFiles();
    }

    if (options.submitMode === "submit") {
      await this.submitAndExpectSubmittedRecord();
    } else {
      await this.stopBeforeSubmit();
    }

    expect(this.forbiddenRequests).toEqual([]);
  }

  private async completeSeniorsCardFields(fields: SeniorsCardScenarioFields) {
    if (fields.dateOfBirth) {
      await this.page.locator("#date-of-birth").fill(fields.dateOfBirth);
      await expect(this.page.locator("#date-of-birth")).toHaveValue(fields.dateOfBirth);
    }

    if (fields.residentialState) {
      await this.page.locator("#residential-state").selectOption(fields.residentialState);
      await expect(this.page.locator("#residential-state")).toHaveValue(fields.residentialState);
    }

    if (fields.ageEligible) {
      await this.page.locator(`label[for="age-eligible-${fields.ageEligible}"]`).click();
      await expect(this.page.locator(`#age-eligible-${fields.ageEligible}`)).toBeChecked();
    }

    if (fields.declaration !== undefined) {
      await this.setCheckboxChecked("#declaration", fields.declaration);
      await expect(this.page.locator("#declaration")).toBeChecked({ checked: fields.declaration });
    }
  }

  private async completeRentalSecuritySubsidyFields(fields: RentalSecuritySubsidyScenarioFields) {
    if (fields.supportType) {
      await this.page.locator("#support-type").selectOption(fields.supportType);
      await expect(this.page.locator("#support-type")).toHaveValue(fields.supportType);
    }

    if (fields.housingSituation) {
      await this.page.locator(`label[for="housing-situation-${fields.housingSituation}"]`).click();
      await expect(this.page.locator(`#housing-situation-${fields.housingSituation}`)).toBeChecked();
    }

    if (fields.weeklyRent) {
      await this.page.locator("#weekly-rent").fill(fields.weeklyRent);
      await expect(this.page.locator("#weekly-rent")).toHaveValue(fields.weeklyRent);
    }

    if (fields.declaration !== undefined) {
      await this.setCheckboxChecked("#declaration", fields.declaration);
      await expect(this.page.locator("#declaration")).toBeChecked({ checked: fields.declaration });
    }
  }

  private async setCheckboxChecked(selector: string, checked: boolean) {
    const checkbox = this.page.locator(selector);

    if (await checkbox.isChecked() !== checked) {
      await this.page.locator(`label[for="${selector.replace(/^#/, "")}"]`).click();
    }
  }

  private async uploadCategorizedFile(evidence: EvidenceUploadConfig) {
    const stagedFileName = evidence.stagedFileName(this.applicant);
    const input = this.page.locator(evidence.inputSelector);

    await expect(input).toHaveAttribute("type", "file");
    await input.setInputFiles(
      createPdfFile(
        stagedFileName,
        [
          `SSQ mock smoke evidence: ${stagedFileName}`,
          `Applicant: ${this.applicant.fullName}`,
          `Email: ${this.applicant.email}`,
          `Phone: ${this.applicant.phone}`
        ].join("\n")
      )
    );
    await expect(this.page.locator(".ssq-categorized-upload__file-name", { hasText: stagedFileName })).toBeVisible();

    const categorySelect = this.page.getByLabel(`Category for ${stagedFileName}`);
    await categorySelect.selectOption(evidence.category);
    await expect(categorySelect).toHaveValue(evidence.category);
  }
}
