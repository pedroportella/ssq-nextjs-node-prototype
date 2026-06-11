"use client";

import { useEffect, useRef, type HTMLAttributes, type ReactNode, type Ref } from "react";

import { ensureSsqWebComponentsDefined } from "../ensureSsqWebComponentsDefined";

export interface SsqWebButtonClickDetail {
  href?: string;
  variant: "primary" | "secondary";
}

export interface SsqWebButtonProps extends Omit<HTMLAttributes<HTMLElement>, "children"> {
  children: ReactNode;
  disabled?: boolean;
  href?: string;
  onSsqClick?: (event: CustomEvent<SsqWebButtonClickDetail>) => void;
  type?: "button" | "submit" | "reset";
  variant?: "primary" | "secondary";
}

export function SsqWebButton({
  children,
  disabled,
  href,
  onSsqClick,
  type = "button",
  variant = "primary",
  ...props
}: SsqWebButtonProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    void ensureSsqWebComponentsDefined();
  }, []);

  useEffect(() => {
    const element = ref.current;

    if (!element || !onSsqClick) {
      return undefined;
    }

    const listener = (event: Event) => onSsqClick(event as CustomEvent<SsqWebButtonClickDetail>);
    element.addEventListener("ssq-click", listener);

    return () => element.removeEventListener("ssq-click", listener);
  }, [onSsqClick]);

  return (
    // React 19 preserves custom-element attributes while the effect above bridges custom events.
    <ssq-button ref={ref} disabled={disabled} href={href} type={type} variant={variant} {...props}>
      {children}
    </ssq-button>
  );
}

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "ssq-button": HTMLAttributes<HTMLElement> & {
        disabled?: boolean;
        href?: string;
        ref?: Ref<HTMLElement>;
        type?: "button" | "submit" | "reset";
        variant?: "primary" | "secondary";
      };
    }
  }
}
