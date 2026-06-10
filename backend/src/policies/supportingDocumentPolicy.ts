export const MAX_SUPPORTING_DOCUMENT_BYTES = 5 * 1024 * 1024;

export const ALLOWED_SUPPORTING_DOCUMENT_EXTENSIONS = [".pdf", ".jpg", ".jpeg", ".png"] as const;

export const ALLOWED_SUPPORTING_DOCUMENT_MIME_TYPES = ["application/pdf", "image/jpeg", "image/png"] as const;

export const ALLOWED_SUPPORTING_DOCUMENT_CATEGORIES = [
  "identity",
  "income",
  "residency",
  "supporting-document"
] as const;

export const supportingDocumentUploadPolicy = {
  allowedCategories: ALLOWED_SUPPORTING_DOCUMENT_CATEGORIES,
  allowedExtensions: ALLOWED_SUPPORTING_DOCUMENT_EXTENSIONS,
  allowedMimeTypes: ALLOWED_SUPPORTING_DOCUMENT_MIME_TYPES,
  maxSizeBytes: MAX_SUPPORTING_DOCUMENT_BYTES
};
