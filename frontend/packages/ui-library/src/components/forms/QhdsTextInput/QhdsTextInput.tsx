import { useId } from "react";

import type { InputHTMLAttributes, ReactNode } from "react";

import { QhdsFormField } from "../QhdsFormField";
import { getQhdsFieldIds, joinClassNames } from "../fieldIds";

import "./QhdsTextInput.scss";

export interface QhdsTextInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "children"> {
  error?: ReactNode;
  hint?: ReactNode;
  label: ReactNode;
  optional?: boolean;
}

export function QhdsTextInput({
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
  type = "text",
  ...inputProps
}: QhdsTextInputProps) {
  const generatedId = useId();
  const controlId = id ?? `ssq-text-input-${generatedId}`;
  const fieldIds = getQhdsFieldIds({ controlId, describedBy: ariaDescribedBy, error, hint });
  const classes = joinClassNames(
    "qld__text-input",
    "qld__text-input--block",
    type === "number" && "qld__text-input--number",
    error ? "qld__text-input--error" : undefined,
    "ssq-input",
    className
  );

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
      <input
        aria-describedby={fieldIds.describedBy}
        aria-invalid={ariaInvalid ?? (error ? true : undefined)}
        className={classes}
        disabled={disabled}
        id={controlId}
        required={required}
        type={type}
        {...inputProps}
      />
    </QhdsFormField>
  );
}
