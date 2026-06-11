import type { ReactNode } from "react";

export interface QhdsFormFieldProps {
  children: ReactNode;
  disabled?: boolean;
  error?: ReactNode;
  errorId?: string;
  hint?: ReactNode;
  hintId?: string;
  id: string;
  label: ReactNode;
  optional?: boolean;
  required?: boolean;
}

export function QhdsFormField({
  children,
  disabled = false,
  error,
  errorId,
  hint,
  hintId,
  id,
  label,
  optional = false,
  required = false
}: QhdsFormFieldProps) {
  return (
    <div className={["ssq-form-field", disabled ? "ssq-form-field--disabled" : "", error ? "ssq-form-field--invalid" : ""].filter(Boolean).join(" ")}>
      <label className="ssq-form-field__label" htmlFor={id}>
        {label}
        {required ? <span className="ssq-form-field__requirement">required</span> : null}
        {!required && optional ? <span className="ssq-form-field__requirement">optional</span> : null}
      </label>
      {hint ? (
        <p className="ssq-form-field__hint" id={hintId}>
          {hint}
        </p>
      ) : null}
      {children}
      {error ? (
        <p className="ssq-form-field__error" id={errorId}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
