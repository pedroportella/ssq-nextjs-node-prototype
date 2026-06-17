import type {
  SsqRecordSubmitMode,
  SsqUploadValidationFile,
  SsqWorkflowScenarioFields
} from "../mock-smoke/helpers/ssqServiceRecordFlow";
import type { SsqServiceApp } from "../mock-smoke/helpers/bttfSsqData";

export interface SsqWorkflowScenario {
  app: SsqServiceApp;
  dashboardLookup: boolean;
  expectedValidationMessages: string[];
  fields: SsqWorkflowScenarioFields;
  id: string;
  label: string;
  summaryDownload: boolean;
  submitMode: SsqRecordSubmitMode;
  withFiles: boolean;
}

export interface SsqUploadValidationScenario {
  app: SsqServiceApp;
  categories?: Array<{
    category: string;
    fileName: string;
  }>;
  expectedMessages: string[];
  files: SsqUploadValidationFile[];
  id: string;
  inputSelector: string;
  label: string;
}

const oneMegabyte = 1024 * 1024;

export const workflowScenarios: SsqWorkflowScenario[] = [
  {
    app: "seniors-card",
    dashboardLookup: true,
    expectedValidationMessages: ["Enter a date of birth that confirms eligibility."],
    fields: {
      "seniors-card": {
        ageEligible: "yes",
        dateOfBirth: "1955-11-05",
        declaration: true,
        residentialState: "qld"
      }
    },
    id: "sc-eligible-qld-senior-submit",
    label: "Seniors Card eligible Queensland senior submits with identity evidence",
    submitMode: "submit",
    summaryDownload: true,
    withFiles: true
  },
  {
    app: "seniors-card",
    dashboardLookup: false,
    expectedValidationMessages: ["Enter a date of birth that confirms eligibility."],
    fields: {
      "seniors-card": {
        ageEligible: "no",
        dateOfBirth: "1964-06-12",
        declaration: true,
        residentialState: "other"
      }
    },
    id: "sc-interstate-concession-stop",
    label: "Seniors Card interstate concession review stops before submit",
    submitMode: "stop-before-submit",
    summaryDownload: false,
    withFiles: false
  },
  {
    app: "rental-security-subsidy",
    dashboardLookup: true,
    expectedValidationMessages: ["Enter the weekly rent amount for the property."],
    fields: {
      "rental-security-subsidy": {
        declaration: true,
        housingSituation: "private-rental",
        supportType: "subsidy",
        weeklyRent: "475"
      }
    },
    id: "rss-private-rental-submit",
    label: "Rental Security Subsidy private rental applicant submits with applicant and household evidence",
    submitMode: "submit",
    summaryDownload: true,
    withFiles: true
  },
  {
    app: "rental-security-subsidy",
    dashboardLookup: false,
    expectedValidationMessages: ["Enter the weekly rent amount for the property."],
    fields: {
      "rental-security-subsidy": {
        declaration: true,
        housingSituation: "supported-accommodation",
        supportType: "bond",
        weeklyRent: "360"
      }
    },
    id: "rss-supported-accommodation-stop",
    label: "Rental Security Subsidy supported accommodation applicant stops before submit",
    submitMode: "stop-before-submit",
    summaryDownload: false,
    withFiles: true
  }
];

export const uploadValidationScenarios: SsqUploadValidationScenario[] = [
  {
    app: "seniors-card",
    expectedMessages: ["Choose a category for identity-evidence-missing-category.pdf."],
    files: [
      {
        name: "identity-evidence-missing-category.pdf"
      }
    ],
    id: "sc-missing-evidence-category",
    inputSelector: "#supporting-evidence-applicant-upload",
    label: "Seniors Card shows a visible category validation message"
  },
  {
    app: "seniors-card",
    expectedMessages: ["identity-evidence-too-large.pdf must be 5.0 MB or smaller."],
    files: [
      {
        name: "identity-evidence-too-large.pdf",
        sizeBytes: (5 * oneMegabyte) + 1
      }
    ],
    id: "sc-oversized-evidence",
    inputSelector: "#supporting-evidence-applicant-upload",
    label: "Seniors Card rejects oversized evidence"
  },
  {
    app: "rental-security-subsidy",
    categories: [
      {
        category: "supporting-evidence",
        fileName: "duplicate-rental-evidence.pdf"
      }
    ],
    expectedMessages: ["Remove duplicate file name duplicate-rental-evidence.pdf from Avery Taylor."],
    files: [
      {
        name: "duplicate-rental-evidence.pdf"
      },
      {
        body: "Same filename, different mock body.",
        name: "duplicate-rental-evidence.pdf"
      }
    ],
    id: "rss-duplicate-evidence-name",
    inputSelector: "#rental-evidence-applicant-upload",
    label: "Rental Security Subsidy flags duplicate applicant evidence names"
  },
  {
    app: "rental-security-subsidy",
    expectedMessages: ["Avery Taylor can have a maximum of 5 files."],
    files: Array.from({ length: 6 }, (_, index) => ({
      name: `rental-evidence-limit-${index + 1}.pdf`
    })),
    id: "rss-applicant-file-count-limit",
    inputSelector: "#rental-evidence-applicant-upload",
    label: "Rental Security Subsidy enforces per-person file count limits"
  },
  {
    app: "rental-security-subsidy",
    expectedMessages: ["Household member files must total 10.0 MB or less."],
    files: [
      {
        name: "household-income-large-1.pdf",
        sizeBytes: 4 * oneMegabyte
      },
      {
        name: "household-income-large-2.pdf",
        sizeBytes: 4 * oneMegabyte
      },
      {
        name: "household-income-large-3.pdf",
        sizeBytes: 4 * oneMegabyte
      }
    ],
    id: "rss-household-total-size-limit",
    inputSelector: "#rental-evidence-household-member-upload",
    label: "Rental Security Subsidy enforces per-person total file size"
  }
];
