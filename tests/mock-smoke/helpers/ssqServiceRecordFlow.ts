import { expect, type Page, type TestInfo } from "@playwright/test";
import { generateBttfSsqApplicantData, type BttfSsqApplicant, type SsqServiceApp } from "./bttfSsqData";

export type SsqRecordSubmitMode = "submit" | "stop-before-submit";

export interface SsqRecordFlowOptions {
  applicant?: BttfSsqApplicant;
  submitMode: SsqRecordSubmitMode;
  testInfo?: TestInfo;
  withFiles?: boolean;
}

interface EvidenceUploadConfig {
  category: string;
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
        inputSelector: "#rental-evidence-applicant-upload",
        savedFileName: "rental-property-evidence.pdf",
        stagedFileName: (applicant) => `rental-property-evidence-${applicant.safeId}.pdf`
      },
      {
        category: "income",
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
  return {
    buffer: Buffer.from(`%PDF-1.4\n${body}\n%%EOF`),
    mimeType: "application/pdf",
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
        `${this.config.statusUrl}#supporting-documents`
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
