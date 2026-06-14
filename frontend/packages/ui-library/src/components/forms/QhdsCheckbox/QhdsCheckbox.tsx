import { useId } from "react";

import type { InputHTMLAttributes, ReactNode } from "react";

import { getQhdsFieldIds, joinClassNames } from "../fieldIds";

import "./QhdsCheckbox.scss";

export interface QhdsCheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "children" | "type"> {
  error?: ReactNode;
  hint?: ReactNode;
  label: ReactNode;
  optional?: boolean;
}

export function QhdsCheckbox({
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
  ...inputProps
}: QhdsCheckboxProps) {
  const generatedId = useId();
  const controlId = id ?? `ssq-checkbox-${generatedId}`;
  const fieldIds = getQhdsFieldIds({ controlId, describedBy: ariaDescribedBy, error, hint });
  const classes = joinClassNames("qld__control-input__input", error ? "qld__input--error" : undefined, "ssq-checkbox__input", className);

  return (
    <div className={joinClassNames("qld__form-group", "ssq-checkbox", disabled && "ssq-checkbox--disabled", error ? "ssq-checkbox--invalid" : undefined)}>
      <div className="qld__control-input qld__control-input--block ssq-checkbox__control">
        <input
          aria-describedby={fieldIds.describedBy}
          aria-invalid={ariaInvalid ?? (error ? true : undefined)}
          className={classes}
          disabled={disabled}
          id={controlId}
          required={required}
          type="checkbox"
          {...inputProps}
        />
        <label className="qld__control-input__text ssq-checkbox__label" htmlFor={controlId}>
          {label}
          {required ? <span className="ssq-form-field__requirement">required</span> : null}
          {!required && optional ? <span className="qld__label--optional ssq-form-field__requirement">optional</span> : null}
        </label>
      </div>
      {hint ? (
        <p className="qld__hint-text ssq-form-field__hint ssq-checkbox__hint" id={fieldIds.hintId}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p className="qld__input--error ssq-form-field__error ssq-checkbox__error" id={fieldIds.errorId}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
