import { useId } from "react";

import type { ReactNode, SelectHTMLAttributes } from "react";

import { QhdsFormField } from "../QhdsFormField";
import { getQhdsFieldIds } from "../fieldIds";

import "./QhdsSelect.scss";

export interface QhdsSelectOption {
  disabled?: boolean;
  label: string;
  value: string;
}

export interface QhdsSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: ReactNode;
  hint?: ReactNode;
  label: ReactNode;
  optional?: boolean;
  options?: QhdsSelectOption[];
}

export function QhdsSelect({
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  children,
  className,
  disabled = false,
  error,
  hint,
  id,
  label,
  optional = false,
  options = [],
  required = false,
  ...selectProps
}: QhdsSelectProps) {
  const generatedId = useId();
  const controlId = id ?? `ssq-select-${generatedId}`;
  const fieldIds = getQhdsFieldIds({ controlId, describedBy: ariaDescribedBy, error, hint });
  const classes = ["ssq-select", className].filter(Boolean).join(" ");

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
      <select
        aria-describedby={fieldIds.describedBy}
        aria-invalid={ariaInvalid ?? (error ? true : undefined)}
        className={classes}
        disabled={disabled}
        id={controlId}
        required={required}
        {...selectProps}
      >
        {children ??
          options.map((option) => (
            <option disabled={option.disabled} key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
      </select>
    </QhdsFormField>
  );
}
