import { useId } from "react";

import type { ReactNode, SelectHTMLAttributes } from "react";

import { QhdsFormField } from "../QhdsFormField";
import { getQhdsFieldIds, joinClassNames } from "../fieldIds";

import "./QhdsSelect.scss";

export interface QhdsSelectOption {
  disabled?: boolean;
  label: string;
  value: string;
}

export type QhdsSelectWidth =
  | "2char"
  | "3char"
  | "4char"
  | "5char"
  | "10char"
  | "20char"
  | "xs"
  | "sm"
  | "md"
  | "lg"
  | "xl"
  | "full"
  | "3-quarters"
  | "half"
  | "1-quarter";

export interface QhdsSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: ReactNode;
  hint?: ReactNode;
  label: ReactNode;
  optional?: boolean;
  options?: QhdsSelectOption[];
  placeholder?: string;
  placeholderDisabled?: boolean;
  placeholderValue?: string;
  width?: QhdsSelectWidth;
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
  multiple = false,
  optional = false,
  options = [],
  placeholder,
  placeholderDisabled = false,
  placeholderValue = "",
  required = false,
  width,
  ...selectProps
}: QhdsSelectProps) {
  const generatedId = useId();
  const controlId = id ?? `ssq-select-${generatedId}`;
  const fieldIds = getQhdsFieldIds({ controlId, describedBy: ariaDescribedBy, error, hint });
  const widthClass = width ? `qld__field-width--${width}` : undefined;
  const classes = joinClassNames(
    "qld__select-control",
    "qld__text-input--block",
    widthClass,
    error ? "qld__text-input--error" : undefined,
    "ssq-select",
    className
  );
  const wrapperClasses = joinClassNames(
    "qld__select",
    error ? "qld__select-error" : undefined,
    multiple ? "ssq-select-wrapper--multiple" : undefined,
    width ? `ssq-select-wrapper--${width}` : undefined,
    "ssq-select-wrapper"
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
      <div className={wrapperClasses}>
        <select
          aria-describedby={fieldIds.describedBy}
          aria-invalid={ariaInvalid ?? (error ? true : undefined)}
          className={classes}
          disabled={disabled}
          id={controlId}
          multiple={multiple}
          required={required}
          {...selectProps}
        >
          {children ?? (
            <>
              {placeholder !== undefined ? (
                <option disabled={placeholderDisabled} value={placeholderValue}>
                  {placeholder}
                </option>
              ) : null}
              {options.map((option) => (
                <option disabled={option.disabled} key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </>
          )}
        </select>
      </div>
    </QhdsFormField>
  );
}
