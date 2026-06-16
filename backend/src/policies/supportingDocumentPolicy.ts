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

export const supportingDocumentUploadPolicy = {
  allowedCategories: ALLOWED_SUPPORTING_DOCUMENT_CATEGORIES,
  allowedExtensions: ALLOWED_SUPPORTING_DOCUMENT_EXTENSIONS,
  allowedMimeTypes: ALLOWED_SUPPORTING_DOCUMENT_MIME_TYPES,
  defaultPersonKey: DEFAULT_SUPPORTING_DOCUMENT_PERSON_KEY,
  maxFilesPerPerson: MAX_SUPPORTING_DOCUMENTS_PER_PERSON,
  maxSizeBytes: MAX_SUPPORTING_DOCUMENT_BYTES,
  maxTotalSizeBytesPerPerson: MAX_SUPPORTING_DOCUMENT_TOTAL_BYTES_PER_PERSON
};
