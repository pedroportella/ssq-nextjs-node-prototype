"use client";

import { useEffect, useRef, type HTMLAttributes, type Ref } from "react";

import { ensureSsqWebComponentsDefined } from "../ensureSsqWebComponentsDefined";

export interface SsqWebTextInputValueDetail {
  value: string;
}

export interface SsqWebTextInputProps extends Omit<HTMLAttributes<HTMLElement>, "inputMode" | "onChange" | "onInput"> {
  disabled?: boolean;
  error?: string;
  hint?: string;
  inputMode?: HTMLAttributes<HTMLElement>["inputMode"];
  label: string;
  name?: string;
  onSsqChange?: (event: CustomEvent<SsqWebTextInputValueDetail>) => void;
  onSsqInput?: (event: CustomEvent<SsqWebTextInputValueDetail>) => void;
  optional?: boolean;
  placeholder?: string;
  required?: boolean;
  type?: string;
  value?: string;
}

export function SsqWebTextInput({
  disabled,
  error,
  hint,
  inputMode,
  label,
  name,
  onSsqChange,
  onSsqInput,
  optional,
  placeholder,
  required,
  type = "text",
  value,
  ...props
}: SsqWebTextInputProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    void ensureSsqWebComponentsDefined();
  }, []);

  useEffect(() => {
    const element = ref.current;

    if (!element) {
      return undefined;
    }

    const inputListener = (event: Event) => onSsqInput?.(event as CustomEvent<SsqWebTextInputValueDetail>);
    const changeListener = (event: Event) => onSsqChange?.(event as CustomEvent<SsqWebTextInputValueDetail>);

    element.addEventListener("ssq-input", inputListener);
    element.addEventListener("ssq-change", changeListener);

    return () => {
      element.removeEventListener("ssq-input", inputListener);
      element.removeEventListener("ssq-change", changeListener);
    };
  }, [onSsqChange, onSsqInput]);

  return (
    <ssq-text-input
      ref={ref}
      disabled={disabled}
      error={error}
      hint={hint}
      input-mode={inputMode}
      label={label}
      name={name}
      optional={optional}
      placeholder={placeholder}
      required={required}
      type={type}
      value={value}
      {...props}
    />
  );
}

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "ssq-text-input": HTMLAttributes<HTMLElement> & {
        disabled?: boolean;
        error?: string;
        hint?: string;
        "input-mode"?: string;
        label?: string;
        name?: string;
        optional?: boolean;
        placeholder?: string;
        ref?: Ref<HTMLElement>;
        required?: boolean;
        type?: string;
        value?: string;
      };
    }
  }
}
