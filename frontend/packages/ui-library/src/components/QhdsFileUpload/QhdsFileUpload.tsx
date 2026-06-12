import type { ChangeEvent, ReactNode } from "react";

import "./QhdsFileUpload.scss";

export interface QhdsFileUploadPolicy {
  acceptedFileTypes: string[];
  maxFileSizeBytes: number;
}

export interface QhdsFileUploadItem {
  category?: string;
  fileName: string;
  message?: ReactNode;
  sizeBytes: number;
  status: "uploaded" | "rejected";
}

export interface QhdsFileUploadProps {
  error?: ReactNode;
  hint?: ReactNode;
  id?: string;
  label: ReactNode;
  multiple?: boolean;
  name: string;
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
  policy: QhdsFileUploadPolicy;
  uploadedFiles?: QhdsFileUploadItem[];
}

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export function QhdsFileUpload({
  error,
  hint,
  id = "supporting-documents",
  label,
  multiple = false,
  name,
  onChange,
  policy,
  uploadedFiles = []
}: QhdsFileUploadProps) {
  const acceptedLabel = policy.acceptedFileTypes.map((type) => type.replace("application/", ".").replace("image/", ".")).join(", ");
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hintId, error ? errorId : undefined].filter(Boolean).join(" ");

  return (
    <div className={["ssq-file-upload", error ? "ssq-file-upload--invalid" : ""].filter(Boolean).join(" ")}>
      <label className="ssq-file-upload__label" htmlFor={id}>
        {label}
      </label>
      {hint ? <p className="ssq-file-upload__hint">{hint}</p> : null}
      <p className="ssq-file-upload__hint" id={hintId}>
        Accepted file types: {acceptedLabel}. Maximum file size: {formatBytes(policy.maxFileSizeBytes)}.
      </p>
      <input
        accept={policy.acceptedFileTypes.join(",")}
        aria-describedby={describedBy}
        aria-invalid={error ? true : undefined}
        className="ssq-file-upload__input"
        id={id}
        multiple={multiple}
        name={name}
        onChange={onChange}
        type="file"
      />
      {error ? (
        <p className="ssq-file-upload__error" id={errorId}>
          {error}
        </p>
      ) : null}
      {uploadedFiles.length > 0 ? (
        <ul className="ssq-file-upload__list">
          {uploadedFiles.map((file) => (
            <li className={`ssq-file-upload__item ssq-file-upload__item--${file.status}`} key={`${file.status}-${file.fileName}`}>
              <span className="ssq-file-upload__file-name">{file.fileName}</span>
              <span className="ssq-file-upload__meta">
                {file.category ? `${file.category} · ` : ""}
                {formatBytes(file.sizeBytes)}
              </span>
              <span className="ssq-file-upload__status">{file.status === "uploaded" ? "Uploaded" : "Rejected"}</span>
              {file.message ? <span className="ssq-file-upload__message">{file.message}</span> : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
