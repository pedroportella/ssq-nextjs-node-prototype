import { useId } from "react";

import type { ChangeEvent, FieldsetHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";

import { getQhdsFieldIds, joinClassNames, toSafeControlId } from "../fieldIds";

import "./QhdsCheckbox.scss";

export interface QhdsCheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "children" | "type"> {
  error?: ReactNode;
  hint?: ReactNode;
  label: ReactNode;
  optional?: boolean;
}

export interface QhdsCheckboxOption {
  checked?: boolean;
  defaultChecked?: boolean;
  disabled?: boolean;
  hint?: ReactNode;
  id?: string;
  label: ReactNode;
  value: string;
}

export interface QhdsCheckboxGroupProps
  extends Omit<FieldsetHTMLAttributes<HTMLFieldSetElement>, "children" | "disabled" | "onChange"> {
  defaultValue?: string[];
  disabled?: boolean;
  error?: ReactNode;
  hint?: ReactNode;
  legend: ReactNode;
  name?: string;
  onChange?: (value: string, checked: boolean, checkedValues: string[], event: ChangeEvent<HTMLInputElement>) => void;
  optional?: boolean;
  options: QhdsCheckboxOption[];
  required?: boolean;
  value?: string[];
}

function getCheckedValues(input: HTMLInputElement, name: string) {
  const fieldset = input.closest("fieldset");
  const inputs = Array.from(fieldset?.querySelectorAll<HTMLInputElement>('input[type="checkbox"]') ?? []);

  return inputs.filter((field) => field.name === name && field.checked).map((field) => field.value);
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

export function QhdsCheckbox({
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  checked,
  className,
  defaultChecked,
  disabled = false,
  error,
  hint,
  id,
  label,
  onChange,
  optional = false,
  readOnly,
  required = false,
  ...inputProps
}: QhdsCheckboxProps) {
  const generatedId = useId();
  const controlId = id ?? `ssq-checkbox-${generatedId}`;
  const fieldIds = getQhdsFieldIds({ controlId, describedBy: ariaDescribedBy, error, hint });
  const classes = joinClassNames("qld__control-input__input", error ? "qld__input--error" : undefined, "ssq-checkbox__input", className);
  const checkedProps = checked !== undefined ? { checked } : { defaultChecked };
  const resolvedReadOnly = readOnly ?? (checked !== undefined && onChange === undefined ? true : undefined);

  return (
    <div className={joinClassNames("qld__form-group", "ssq-checkbox", disabled && "ssq-checkbox--disabled", error ? "ssq-checkbox--invalid" : undefined)}>
      <div className="qld__control-input qld__control-input--block ssq-checkbox__control">
        <input
          {...inputProps}
          {...checkedProps}
          aria-describedby={fieldIds.describedBy}
          aria-invalid={ariaInvalid ?? (error ? true : undefined)}
          className={classes}
          disabled={disabled}
          id={controlId}
          onChange={onChange}
          readOnly={resolvedReadOnly}
          required={required}
          type="checkbox"
        />
        <label className="qld__control-input__text ssq-checkbox__label" htmlFor={controlId}>
          {label}
          {renderRequirement(required, optional)}
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

export function QhdsCheckboxGroup({
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
}: QhdsCheckboxGroupProps) {
  const generatedId = useId();
  const controlId = id ?? `ssq-checkbox-group-${generatedId}`;
  const fieldIds = getQhdsFieldIds({ controlId, describedBy: ariaDescribedBy, error, hint });
  const groupName = name ?? controlId;
  const controlledValues = value;
  const defaultValues = defaultValue ?? options.filter((option) => option.defaultChecked ?? option.checked).map((option) => option.value);

  return (
    <fieldset
      {...fieldsetProps}
      aria-describedby={fieldIds.describedBy}
      aria-labelledby={`${controlId}-legend`}
      aria-required={required || undefined}
      className={joinClassNames(
        "qld__form-group",
        "qld__checkboxes",
        "ssq-checkbox-group",
        disabled && "ssq-checkbox-group--disabled",
        error ? "ssq-checkbox-group--invalid" : undefined,
        className
      )}
      disabled={disabled}
      id={controlId}
      role="group"
    >
      <legend className="qld__fieldset__legend ssq-checkbox-group__legend" id={`${controlId}-legend`}>
        {legend}
        {renderRequirement(required, optional)}
      </legend>
      {hint ? (
        <span className="qld__hint-text ssq-form-field__hint ssq-checkbox-group__hint" id={fieldIds.hintId}>
          {hint}
        </span>
      ) : null}
      {error ? (
        <span aria-live="polite" className="qld__input--error ssq-form-field__error ssq-checkbox-group__error" id={fieldIds.errorId} role="status">
          {error}
        </span>
      ) : null}
      <div className="qld__control-group ssq-checkbox-group__options">
        {options.map((option, index) => {
          const optionId = option.id ?? `${controlId}-${toSafeControlId(option.value) || `option-${index + 1}`}`;
          const optionHintId = option.hint ? `${optionId}-hint` : undefined;
          const describedBy = [fieldIds.describedBy, optionHintId].filter(Boolean).join(" ") || undefined;
          const optionDisabled = disabled || option.disabled;
          const checkedProps =
            controlledValues !== undefined
              ? { checked: controlledValues.includes(option.value) }
              : { defaultChecked: defaultValues.includes(option.value) };

          return (
            <div className="qld__control-input qld__control-input--block ssq-checkbox-group__option" key={optionId}>
              <input
                {...checkedProps}
                aria-describedby={describedBy}
                aria-invalid={error ? true : undefined}
                className={joinClassNames("qld__control-input__input", error ? "qld__input--error" : undefined, "ssq-checkbox__input")}
                disabled={optionDisabled}
                id={optionId}
                name={groupName}
                onChange={
                  onChange
                    ? (event) => onChange(option.value, event.currentTarget.checked, getCheckedValues(event.currentTarget, groupName), event)
                    : undefined
                }
                readOnly={controlledValues !== undefined && onChange === undefined ? true : undefined}
                type="checkbox"
                value={option.value}
              />
              <label className="qld__control-input__text ssq-checkbox__label" htmlFor={optionId}>
                {option.label}
              </label>
              {option.hint ? (
                <span className="qld__hint-text ssq-checkbox__hint" id={optionHintId}>
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
