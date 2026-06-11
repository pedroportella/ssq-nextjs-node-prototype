import { useId } from "react";

import type { ReactNode, TextareaHTMLAttributes } from "react";

import { getQhdsFieldIds } from "./fieldIds";
import { QhdsFormField } from "./QhdsFormField";

export interface QhdsTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: ReactNode;
  hint?: ReactNode;
  label: ReactNode;
  optional?: boolean;
}

export function QhdsTextarea({
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  className,
  disabled = false,
  error,
  hint,
  id,
  label,
  optional = false,
  required = false,
  ...textareaProps
}: QhdsTextareaProps) {
  const generatedId = useId();
  const controlId = id ?? `ssq-textarea-${generatedId}`;
  const fieldIds = getQhdsFieldIds({ controlId, describedBy: ariaDescribedBy, error, hint });
  const classes = ["ssq-textarea", className].filter(Boolean).join(" ");

  return (
    <QhdsFormField
      disabled={disabled}
      error={error}
      errorId={fieldIds.errorId}
      hint={hint}
      hintId={fieldIds.hintId}
      id={controlId}
      label={label}
      optional={optional}
      required={required}
    >
      <textarea
        aria-describedby={fieldIds.describedBy}
        aria-invalid={ariaInvalid ?? (error ? true : undefined)}
        className={classes}
        disabled={disabled}
        id={controlId}
        required={required}
        {...textareaProps}
      />
    </QhdsFormField>
  );
}
