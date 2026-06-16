import type { ReactNode } from "react";

export type QhdsCategorizedFileUploadStatus = "staged" | "uploaded" | "rejected";

export interface QhdsCategorizedFileUploadCategoryOption {
  hint?: ReactNode;
  label: string;
  value: string;
}

export interface QhdsCategorizedFileUploadPerson {
  hint?: ReactNode;
  key: string;
  label: string;
}

export interface QhdsCategorizedFileUploadPolicy {
  acceptedFileTypes: string[];
  maxFileSizeBytes: number;
  maxFilesPerPerson: number;
  maxTotalSizeBytesPerPerson: number;
}

export interface QhdsCategorizedFileUploadItem {
  category?: string;
  file?: File;
  fileName: string;
  id: string;
  message?: ReactNode;
  mimeType: string;
  personKey: string;
  sizeBytes: number;
  status: QhdsCategorizedFileUploadStatus;
}

export interface QhdsCategorizedFileUploadValidationResult {
  fileErrors: Record<string, string[]>;
  firstErrorTargetId?: string;
  isValid: boolean;
  personErrors: Record<string, string[]>;
}

export interface QhdsCategorizedFileUploadValidationInput {
  categories: QhdsCategorizedFileUploadCategoryOption[];
  files: QhdsCategorizedFileUploadItem[];
  people: QhdsCategorizedFileUploadPerson[];
  policy: QhdsCategorizedFileUploadPolicy;
}

function addError(target: Record<string, string[]>, key: string, message: string) {
  target[key] = [...(target[key] ?? []), message];
}

function getExtension(fileName: string) {
  const parts = fileName.toLowerCase().split(".");
  return parts.length > 1 ? `.${parts.at(-1)}` : "";
}

export function sanitizeUploadFileName(fileName: string) {
  const safeName = fileName
    .replace(/[^a-zA-Z0-9\s._-]/g, "_")
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "_")
    .trim()
    .replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, "");

  return safeName || "file";
}

export function fileMatchesAcceptedType({
  acceptedFileTypes,
  fileName,
  mimeType
}: {
  acceptedFileTypes: string[];
  fileName: string;
  mimeType: string;
}) {
  if (acceptedFileTypes.length === 0) {
    return true;
  }

  const extension = getExtension(fileName);
  const normalizedMime = mimeType.toLowerCase();

  return acceptedFileTypes.some((rule) => {
    const normalizedRule = rule.trim().toLowerCase();

    if (!normalizedRule) {
      return false;
    }

    if (normalizedRule.startsWith(".")) {
      return extension === normalizedRule;
    }

    if (normalizedRule.endsWith("/*")) {
      return normalizedMime.startsWith(normalizedRule.slice(0, -1));
    }

    return normalizedMime === normalizedRule;
  });
}

function formatBytes(bytes: number) {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function firstErrorKey(errors: Record<string, string[]>) {
  return Object.keys(errors).find((key) => (errors[key]?.length ?? 0) > 0);
}

export function validateCategorizedFileUpload({
  categories,
  files,
  people,
  policy
}: QhdsCategorizedFileUploadValidationInput): QhdsCategorizedFileUploadValidationResult {
  const allowedCategoryValues = new Set(categories.map((category) => category.value));
  const allowedPeople = new Set(people.map((person) => person.key));
  const fileErrors: Record<string, string[]> = {};
  const personErrors: Record<string, string[]> = {};

  for (const file of files) {
    if (!allowedPeople.has(file.personKey)) {
      addError(fileErrors, file.id, "This file is attached to an unknown person.");
    }

    if (file.status !== "rejected" && !file.category) {
      addError(fileErrors, file.id, `Choose a category for ${file.fileName}.`);
    } else if (file.status !== "rejected" && file.category && !allowedCategoryValues.has(file.category)) {
      addError(fileErrors, file.id, `Choose a valid category for ${file.fileName}.`);
    }

    if (file.sizeBytes <= 0) {
      addError(fileErrors, file.id, `${file.fileName} is empty.`);
    }

    if (file.sizeBytes > policy.maxFileSizeBytes) {
      addError(fileErrors, file.id, `${file.fileName} must be ${formatBytes(policy.maxFileSizeBytes)} or smaller.`);
    }

    if (
      !fileMatchesAcceptedType({
        acceptedFileTypes: policy.acceptedFileTypes,
        fileName: file.fileName,
        mimeType: file.mimeType
      })
    ) {
      addError(fileErrors, file.id, `${file.fileName} is not an accepted file type.`);
    }
  }

  for (const person of people) {
    const personFiles = files.filter((file) => file.personKey === person.key && file.status !== "rejected");
    const totalBytes = personFiles.reduce((sum, file) => sum + file.sizeBytes, 0);

    if (personFiles.length > policy.maxFilesPerPerson) {
      addError(
        personErrors,
        person.key,
        `${person.label} can have a maximum of ${policy.maxFilesPerPerson} file${policy.maxFilesPerPerson === 1 ? "" : "s"}.`
      );
    }

    if (totalBytes > policy.maxTotalSizeBytesPerPerson) {
      addError(personErrors, person.key, `${person.label} files must total ${formatBytes(policy.maxTotalSizeBytesPerPerson)} or less.`);
    }

    const fileNames = new Map<string, QhdsCategorizedFileUploadItem[]>();
    for (const file of personFiles) {
      const normalizedName = file.fileName.trim().toLowerCase();
      fileNames.set(normalizedName, [...(fileNames.get(normalizedName) ?? []), file]);
    }

    for (const duplicateFiles of fileNames.values()) {
      if (duplicateFiles.length > 1) {
        for (const duplicateFile of duplicateFiles) {
          addError(fileErrors, duplicateFile.id, `Remove duplicate file name ${duplicateFile.fileName} from ${person.label}.`);
        }
      }
    }
  }

  const firstFileErrorId = firstErrorKey(fileErrors);
  const firstFileError = firstFileErrorId ? files.find((file) => file.id === firstFileErrorId) : undefined;
  const firstPersonErrorKey = firstErrorKey(personErrors);

  return {
    fileErrors,
    firstErrorTargetId: firstFileErrorId
      ? firstFileError?.status === "rejected"
        ? `${firstFileErrorId}-row`
        : `${firstFileErrorId}-category`
      : firstPersonErrorKey
        ? `${firstPersonErrorKey}-upload`
        : undefined,
    isValid: Object.keys(fileErrors).length === 0 && Object.keys(personErrors).length === 0,
    personErrors
  };
}

export function formatCategorizedUploadBytes(bytes: number) {
  return formatBytes(bytes);
}
