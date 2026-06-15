import { useId } from "react";

import type { ChangeEvent, FieldsetHTMLAttributes, ReactNode } from "react";

import { getQhdsFieldIds, joinClassNames, toSafeControlId } from "../fieldIds";

import "./QhdsRadioGroup.scss";

export interface QhdsRadioOption {
  disabled?: boolean;
  hint?: ReactNode;
  id?: string;
  label: ReactNode;
  value: string;
}

export interface QhdsRadioGroupProps extends Omit<FieldsetHTMLAttributes<HTMLFieldSetElement>, "children" | "disabled" | "onChange"> {
  defaultValue?: string;
  disabled?: boolean;
  error?: ReactNode;
  hint?: ReactNode;
  id?: string;
  legend: ReactNode;
  name?: string;
  onChange?: (value: string, event: ChangeEvent<HTMLInputElement>) => void;
  optional?: boolean;
  options: QhdsRadioOption[];
  required?: boolean;
  value?: string;
}

function renderRequirement(required: boolean, optional: boolean) {
  if (required) {
    return <span className="ssq-form-field__requirement">required</span>;
  }

  if (optional) {
    return <span className="qld__label--optional ssq-form-field__requirement">optional</span>;
  }

  return null;
}

export function QhdsRadioGroup({
  "aria-describedby": ariaDescribedBy,
  className,
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
  value,
  ...fieldsetProps
}: QhdsRadioGroupProps) {
  const generatedId = useId();
  const controlId = id ?? `ssq-radio-group-${generatedId}`;
  const fieldIds = getQhdsFieldIds({ controlId, describedBy: ariaDescribedBy, error, hint });
  const groupName = name ?? controlId;
  const requiredOptionIndex = disabled ? -1 : options.findIndex((option) => !option.disabled);

  return (
    <fieldset
      {...fieldsetProps}
      aria-describedby={fieldIds.describedBy}
      aria-labelledby={`${controlId}-legend`}
      aria-required={required || undefined}
      className={joinClassNames(
        "qld__form-group",
        "qld__radio-buttons",
        "ssq-radio-group",
        disabled && "ssq-radio-group--disabled",
        error ? "ssq-radio-group--invalid" : undefined,
        className
      )}
      disabled={disabled}
      id={controlId}
      role="radiogroup"
    >
      <legend className="qld__fieldset__legend ssq-radio-group__legend" id={`${controlId}-legend`}>
        {legend}
        {renderRequirement(required, optional)}
      </legend>
      {hint ? (
        <span className="qld__hint-text ssq-form-field__hint ssq-radio-group__hint" id={fieldIds.hintId}>
          {hint}
        </span>
      ) : null}
      {error ? (
        <span aria-live="polite" className="qld__input--error ssq-form-field__error ssq-radio-group__error" id={fieldIds.errorId} role="status">
          {error}
        </span>
      ) : null}
      <div className="qld__control-group ssq-radio-group__options">
        {options.map((option, index) => {
          const optionId = option.id ?? `${controlId}-${toSafeControlId(option.value) || `option-${index + 1}`}`;
          const optionHintId = option.hint ? `${optionId}-hint` : undefined;
          const describedBy = [fieldIds.describedBy, optionHintId].filter(Boolean).join(" ") || undefined;
          const checkedProps = value !== undefined ? { checked: value === option.value } : { defaultChecked: defaultValue === option.value };
          const optionDisabled = disabled || option.disabled;

          return (
            <div className="qld__control-input qld__control-input--block ssq-radio" key={optionId}>
              <input
                {...checkedProps}
                aria-describedby={describedBy}
                aria-invalid={error ? true : undefined}
                className={joinClassNames("qld__control-input__input", error ? "qld__input--error" : undefined, "ssq-radio__input")}
                disabled={optionDisabled}
                id={optionId}
                name={groupName}
                onChange={onChange ? (event) => onChange(option.value, event) : undefined}
                readOnly={value !== undefined && onChange === undefined ? true : undefined}
                required={required && index === requiredOptionIndex}
                type="radio"
                value={option.value}
              />
              <label className="qld__control-input__text ssq-radio__label" htmlFor={optionId}>
                {option.label}
              </label>
              {option.hint ? (
                <span className="qld__hint-text ssq-radio__hint" id={optionHintId}>
                  {option.hint}
                </span>
              ) : null}
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}
