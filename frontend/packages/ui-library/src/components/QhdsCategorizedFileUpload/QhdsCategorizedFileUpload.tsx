"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { joinClassNames, toSafeControlId } from "../forms/fieldIds";
import {
  fileMatchesAcceptedType,
  formatCategorizedUploadBytes,
  sanitizeUploadFileName,
  validateCategorizedFileUpload
} from "./validation";

import type { ChangeEvent, DragEvent, ReactNode } from "react";
import type {
  QhdsCategorizedFileUploadCategoryOption,
  QhdsCategorizedFileUploadItem,
  QhdsCategorizedFileUploadPerson,
  QhdsCategorizedFileUploadPolicy,
  QhdsCategorizedFileUploadValidationResult
} from "./validation";

import "./QhdsCategorizedFileUpload.scss";

export interface QhdsCategorizedFileUploadProps {
  categories: QhdsCategorizedFileUploadCategoryOption[];
  disabled?: boolean;
  hint?: ReactNode;
  id?: string;
  label: ReactNode;
  name: string;
  onChange?: (items: QhdsCategorizedFileUploadItem[]) => void;
  onValidationChange?: (result: QhdsCategorizedFileUploadValidationResult) => void;
  people: QhdsCategorizedFileUploadPerson[];
  policy: QhdsCategorizedFileUploadPolicy;
  value?: QhdsCategorizedFileUploadItem[];
}

let fallbackId = 0;

function createUploadItemId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  fallbackId += 1;
  return `ssq-upload-${fallbackId}`;
}

function useControlledUploadItems({
  onChange,
  value
}: {
  onChange?: (items: QhdsCategorizedFileUploadItem[]) => void;
  value?: QhdsCategorizedFileUploadItem[];
}) {
  const isControlled = value !== undefined;
  const [internalItems, setInternalItems] = useState<QhdsCategorizedFileUploadItem[]>([]);
  const items = isControlled ? value : internalItems;
  const latestItems = useRef(items);

  useEffect(() => {
    latestItems.current = items;
  }, [items]);

  const setItems = (next: QhdsCategorizedFileUploadItem[] | ((previous: QhdsCategorizedFileUploadItem[]) => QhdsCategorizedFileUploadItem[])) => {
    const resolved = typeof next === "function" ? next(latestItems.current) : next;

    latestItems.current = resolved;
    if (!isControlled) {
      setInternalItems(resolved);
    }
    onChange?.(resolved);
  };

  return [items, setItems] as const;
}

function getAcceptedLabel(acceptedFileTypes: string[]) {
  if (acceptedFileTypes.length === 0) {
    return "Any file type";
  }

  return acceptedFileTypes.map((type) => (type.startsWith(".") ? type : type.replace("application/", ".").replace("image/", "."))).join(", ");
}

function createUploadItem({
  file,
  personKey,
  policy
}: {
  file: File;
  personKey: string;
  policy: QhdsCategorizedFileUploadPolicy;
}): QhdsCategorizedFileUploadItem {
  const fileName = sanitizeUploadFileName(file.name);
  const mimeType = file.type || "application/octet-stream";
  const hasImmediateError =
    file.size <= 0 ||
    file.size > policy.maxFileSizeBytes ||
    !fileMatchesAcceptedType({
      acceptedFileTypes: policy.acceptedFileTypes,
      fileName,
      mimeType
    });

  return {
    category: "",
    file,
    fileName,
    id: createUploadItemId(),
    mimeType,
    personKey,
    sizeBytes: file.size,
    status: hasImmediateError ? "rejected" : "staged"
  };
}

export function QhdsCategorizedFileUpload({
  categories,
  disabled = false,
  hint,
  id = "categorized-documents",
  label,
  name,
  onChange,
  onValidationChange,
  people,
  policy,
  value
}: QhdsCategorizedFileUploadProps) {
  const [items, setItems] = useControlledUploadItems({ onChange, value });
  const validation = useMemo(
    () => validateCategorizedFileUpload({ categories, files: items, people, policy }),
    [categories, items, people, policy]
  );
  const acceptedLabel = getAcceptedLabel(policy.acceptedFileTypes);
  const hintId = hint ? `${id}-hint` : undefined;
  const policyId = `${id}-policy`;

  useEffect(() => {
    onValidationChange?.(validation);
  }, [onValidationChange, validation]);

  const addFilesForPerson = (personKey: string, files: File[]) => {
    if (disabled || files.length === 0) {
      return;
    }

    const nextItems = files.map((file) => createUploadItem({ file, personKey, policy }));
    setItems((previous) => [...previous, ...nextItems]);
  };

  const handleInputChange = (personKey: string) => (event: ChangeEvent<HTMLInputElement>) => {
    addFilesForPerson(personKey, Array.from(event.target.files ?? []));
    event.target.value = "";
  };

  const handleDrop = (personKey: string) => (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    addFilesForPerson(personKey, Array.from(event.dataTransfer.files ?? []));
  };

  const handleCategoryChange = (itemId: string, category: string) => {
    setItems((previous) => previous.map((item) => (item.id === itemId ? { ...item, category } : item)));
  };

  const removeItem = (itemId: string) => {
    setItems((previous) => previous.filter((item) => item.id !== itemId));
  };

  return (
    <div className="qld__form-group ssq-categorized-upload">
      <div className="ssq-categorized-upload__header">
        <span className="qld__label ssq-categorized-upload__label">{label}</span>
        {hint ? (
          <p className="qld__hint-text ssq-categorized-upload__hint" id={hintId}>
            {hint}
          </p>
        ) : null}
        <p className="qld__hint-text ssq-categorized-upload__hint" id={policyId}>
          Accepted file types: {acceptedLabel}. Maximum file size: {formatCategorizedUploadBytes(policy.maxFileSizeBytes)}. Maximum{" "}
          {policy.maxFilesPerPerson} file{policy.maxFilesPerPerson === 1 ? "" : "s"} and{" "}
          {formatCategorizedUploadBytes(policy.maxTotalSizeBytesPerPerson)} total per person.
        </p>
      </div>

      <div className="ssq-categorized-upload__people">
        {people.map((person) => {
          const personId = `${id}-${toSafeControlId(person.key)}`;
          const personItems = items.filter((item) => item.personKey === person.key);
          const personErrors = validation.personErrors[person.key] ?? [];
          const personErrorId = personErrors.length > 0 ? `${personId}-error` : undefined;
          const inputId = `${personId}-upload`;
          const inputDescribedBy = [hintId, policyId, person.hint ? `${personId}-hint` : undefined, personErrorId].filter(Boolean).join(" ");

          return (
            <fieldset className="qld__fieldset ssq-categorized-upload__person" key={person.key}>
              <legend className="qld__legend ssq-categorized-upload__person-heading">{person.label}</legend>
              {person.hint ? (
                <p className="qld__hint-text ssq-categorized-upload__hint" id={`${personId}-hint`}>
                  {person.hint}
                </p>
              ) : null}

              <div className="qld__form-file-wrapper ssq-categorized-upload__wrapper">
                <div
                  className={joinClassNames(
                    "qld__form-file-dropzone",
                    "ssq-categorized-upload__dropzone",
                    personErrors.length > 0 ? "qld__input--error" : undefined
                  )}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={handleDrop(person.key)}
                >
                  <input
                    accept={policy.acceptedFileTypes.join(",")}
                    aria-describedby={inputDescribedBy || undefined}
                    aria-invalid={personErrors.length > 0 ? true : undefined}
                    className="qld__file-input ssq-categorized-upload__input"
                    disabled={disabled}
                    id={inputId}
                    multiple
                    name={`${name}[${person.key}][]`}
                    onChange={handleInputChange(person.key)}
                    type="file"
                  />
                </div>
              </div>

              {personErrors.length > 0 ? (
                <ul className="qld__input--error ssq-categorized-upload__errors" id={personErrorId}>
                  {personErrors.map((error) => (
                    <li key={error}>{error}</li>
                  ))}
                </ul>
              ) : null}

              {personItems.length > 0 ? (
                <ul className="qld__form-file-preview ssq-categorized-upload__list">
                  {personItems.map((item) => {
                    const fileErrors = validation.fileErrors[item.id] ?? [];
                    const itemHasErrors = item.status === "rejected" || fileErrors.length > 0;
                    const categoryId = `${item.id}-category`;
                    const fileErrorId = fileErrors.length > 0 ? `${item.id}-error` : undefined;

                    return (
                      <li
                        className={joinClassNames(
                          "qld__form-file",
                          itemHasErrors ? "qld__form-file--error" : "qld__form-file--complete",
                          "ssq-categorized-upload__item",
                          itemHasErrors ? "ssq-categorized-upload__item--error" : "ssq-categorized-upload__item--staged"
                        )}
                        id={`${item.id}-row`}
                        key={item.id}
                      >
                        <div className="ssq-categorized-upload__item-main">
                          <span className="ssq-categorized-upload__file-name">{item.fileName}</span>
                          <span className="ssq-categorized-upload__meta">{formatCategorizedUploadBytes(item.sizeBytes)}</span>
                        </div>

                        {item.status !== "rejected" ? (
                          <div className="ssq-categorized-upload__category">
                            <label className="qld__label ssq-categorized-upload__category-label" htmlFor={categoryId}>
                              Category for {item.fileName}
                            </label>
                            <select
                              aria-describedby={fileErrorId}
                              aria-invalid={fileErrors.length > 0 ? true : undefined}
                              className={joinClassNames("qld__select-control", fileErrors.length > 0 ? "qld__text-input--error" : undefined)}
                              disabled={disabled}
                              id={categoryId}
                              onChange={(event) => handleCategoryChange(item.id, event.target.value)}
                              value={item.category ?? ""}
                            >
                              <option value="">Select a category</option>
                              {categories.map((category) => (
                                <option key={category.value} value={category.value}>
                                  {category.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        ) : null}

                        {fileErrors.length > 0 ? (
                          <ul className="qld__input--error ssq-categorized-upload__errors" id={fileErrorId}>
                            {fileErrors.map((error) => (
                              <li key={error}>{error}</li>
                            ))}
                          </ul>
                        ) : null}

                        {item.message ? <p className="ssq-categorized-upload__message">{item.message}</p> : null}

                        <button
                          className="qld__btn qld__btn--tertiary ssq-categorized-upload__remove"
                          disabled={disabled}
                          onClick={() => removeItem(item.id)}
                          type="button"
                        >
                          Remove
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : null}
            </fieldset>
          );
        })}
      </div>
    </div>
  );
}
