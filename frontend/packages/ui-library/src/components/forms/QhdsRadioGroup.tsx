import { useId } from "react";

import type { ReactNode } from "react";

import { getQhdsFieldIds, toSafeControlId } from "./fieldIds";

export interface QhdsRadioOption {
  disabled?: boolean;
  hint?: ReactNode;
  label: ReactNode;
  value: string;
}

export interface QhdsRadioGroupProps {
  defaultValue?: string;
  disabled?: boolean;
  error?: ReactNode;
  hint?: ReactNode;
  id?: string;
  legend: ReactNode;
  name?: string;
  onChange?: (value: string) => void;
  optional?: boolean;
  options: QhdsRadioOption[];
  required?: boolean;
  value?: string;
}

export function QhdsRadioGroup({
  defaultValue,
  disabled = false,
  error,
  hint,
  id,
  legend,
  name,
  onChange,
  optional = false,
  options,
  required = false,
  value
}: QhdsRadioGroupProps) {
  const generatedId = useId();
  const controlId = id ?? `ssq-radio-group-${generatedId}`;
  const fieldIds = getQhdsFieldIds({ controlId, error, hint });
  const groupName = name ?? controlId;

  return (
    <fieldset
      aria-describedby={fieldIds.describedBy}
      className={["ssq-radio-group", disabled ? "ssq-radio-group--disabled" : "", error ? "ssq-radio-group--invalid" : ""].filter(Boolean).join(" ")}
      disabled={disabled}
      id={controlId}
    >
      <legend className="ssq-radio-group__legend">
        {legend}
        {required ? <span className="ssq-form-field__requirement">required</span> : null}
        {!required && optional ? <span className="ssq-form-field__requirement">optional</span> : null}
      </legend>
      {hint ? (
        <p className="ssq-form-field__hint" id={fieldIds.hintId}>
          {hint}
        </p>
      ) : null}
      <div className="ssq-radio-group__options">
        {options.map((option) => {
          const optionId = `${controlId}-${toSafeControlId(option.value)}`;
          const checkedProps = value !== undefined ? { checked: value === option.value } : { defaultChecked: defaultValue === option.value };

          return (
            <div className="ssq-radio" key={option.value}>
              <input
                aria-invalid={error ? true : undefined}
                className="ssq-radio__input"
                disabled={disabled || option.disabled}
                id={optionId}
                name={groupName}
                onChange={onChange ? () => onChange(option.value) : undefined}
                required={required}
                type="radio"
                value={option.value}
                {...checkedProps}
              />
              <label className="ssq-radio__label" htmlFor={optionId}>
                {option.label}
              </label>
              {option.hint ? <p className="ssq-radio__hint">{option.hint}</p> : null}
            </div>
          );
        })}
      </div>
      {error ? (
        <p className="ssq-form-field__error" id={fieldIds.errorId}>
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
