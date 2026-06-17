export const MAX_SUPPORTING_DOCUMENT_BYTES = 5 * 1024 * 1024;

export const MAX_SUPPORTING_DOCUMENTS_PER_PERSON = 5;

export const MAX_SUPPORTING_DOCUMENT_TOTAL_BYTES_PER_PERSON = 10 * 1024 * 1024;

export const DEFAULT_SUPPORTING_DOCUMENT_PERSON_KEY = "applicant";

export const ALLOWED_SUPPORTING_DOCUMENT_EXTENSIONS = [".pdf", ".jpg", ".jpeg", ".png"] as const;

export const ALLOWED_SUPPORTING_DOCUMENT_MIME_TYPES = ["application/pdf", "image/jpeg", "image/png"] as const;

export const ALLOWED_SUPPORTING_DOCUMENT_CATEGORIES = [
  "concession",
  "identity",
  "income",
  "other",
  "residency",
  "supporting-evidence",
  "supporting-document"
] as const;

export const SUPPORTING_DOCUMENT_EXTENSION_MIME_TYPES = {
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".pdf": "application/pdf",
  ".png": "image/png"
} as const;

export interface SupportingDocumentUploadPolicy {
  allowedCategories: readonly (typeof ALLOWED_SUPPORTING_DOCUMENT_CATEGORIES)[number][];
  allowedExtensions: readonly (typeof ALLOWED_SUPPORTING_DOCUMENT_EXTENSIONS)[number][];
  allowedMimeTypes: readonly (typeof ALLOWED_SUPPORTING_DOCUMENT_MIME_TYPES)[number][];
  allowedPersonKeys: readonly string[];
  defaultPersonKey: string;
  maxFilesPerPerson: number;
  maxSizeBytes: number;
  maxTotalSizeBytesPerPerson: number;
}

const sharedPolicy = {
  allowedExtensions: ALLOWED_SUPPORTING_DOCUMENT_EXTENSIONS,
  allowedMimeTypes: ALLOWED_SUPPORTING_DOCUMENT_MIME_TYPES,
  defaultPersonKey: DEFAULT_SUPPORTING_DOCUMENT_PERSON_KEY,
  maxFilesPerPerson: MAX_SUPPORTING_DOCUMENTS_PER_PERSON,
  maxSizeBytes: MAX_SUPPORTING_DOCUMENT_BYTES,
  maxTotalSizeBytesPerPerson: MAX_SUPPORTING_DOCUMENT_TOTAL_BYTES_PER_PERSON
} as const;

export const supportingDocumentUploadPolicy: SupportingDocumentUploadPolicy = {
  ...sharedPolicy,
  allowedCategories: ALLOWED_SUPPORTING_DOCUMENT_CATEGORIES,
  allowedPersonKeys: [DEFAULT_SUPPORTING_DOCUMENT_PERSON_KEY]
};

export const supportingDocumentUploadPoliciesByTransaction = {
  "rental-security-subsidy": {
    ...sharedPolicy,
    allowedCategories: ["identity", "residency", "income", "supporting-evidence"],
    allowedPersonKeys: [DEFAULT_SUPPORTING_DOCUMENT_PERSON_KEY, "household-member"]
  },
  "seniors-card": {
    ...sharedPolicy,
    allowedCategories: ["identity", "residency", "concession", "supporting-evidence"],
    allowedPersonKeys: [DEFAULT_SUPPORTING_DOCUMENT_PERSON_KEY]
  }
} as const satisfies Record<string, SupportingDocumentUploadPolicy>;

export function getSupportingDocumentUploadPolicy(transactionKey?: string): SupportingDocumentUploadPolicy {
  if (transactionKey && transactionKey in supportingDocumentUploadPoliciesByTransaction) {
    return supportingDocumentUploadPoliciesByTransaction[transactionKey as keyof typeof supportingDocumentUploadPoliciesByTransaction];
  }

  return supportingDocumentUploadPolicy;
}
