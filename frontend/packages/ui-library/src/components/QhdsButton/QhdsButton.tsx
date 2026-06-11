import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

import "./QhdsButton.scss";

type ButtonVariant = "primary" | "secondary";

interface ButtonBaseProps {
  children: ReactNode;
  variant?: ButtonVariant;
}

export type QhdsButtonProps =
  | (ButtonBaseProps & ButtonHTMLAttributes<HTMLButtonElement> & { href?: never })
  | (ButtonBaseProps & AnchorHTMLAttributes<HTMLAnchorElement> & { href: string });

export function QhdsButton({ children, className, variant = "primary", ...props }: QhdsButtonProps) {
  const classes = ["ssq-button", `ssq-button--${variant}`, className].filter(Boolean).join(" ");

  if ("href" in props && props.href) {
    return (
      <a className={classes} {...props}>
        {children}
      </a>
    );
  }

  const buttonProps = props as ButtonHTMLAttributes<HTMLButtonElement>;

  return (
    <button className={classes} type={buttonProps.type ?? "button"} {...buttonProps}>
      {children}
    </button>
  );
}
