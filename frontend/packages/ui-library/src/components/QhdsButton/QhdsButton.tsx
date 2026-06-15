import type { AnchorHTMLAttributes, ButtonHTMLAttributes, MouseEvent, ReactNode } from "react";

import "./QhdsButton.scss";

type ButtonVariant = "primary" | "secondary" | "tertiary";

interface ButtonBaseProps {
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  variant?: ButtonVariant;
}

export type QhdsButtonProps =
  | (ButtonBaseProps &
      Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "className" | "disabled"> & {
        href?: never;
        onNavigate?: never;
        route?: never;
      })
  | (ButtonBaseProps &
      Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "children" | "className" | "disabled" | "href" | "type"> & {
        href: string;
        onNavigate?: (href: string) => void;
        route?: never;
        type?: never;
      })
  | (ButtonBaseProps &
      Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "children" | "className" | "disabled" | "href" | "type"> & {
        href?: never;
        onNavigate?: (route: string) => void;
        route: string;
        type?: never;
      });

function getButtonClasses({
  className,
  disabled,
  leadingIcon,
  trailingIcon,
  variant
}: {
  className?: string;
  disabled: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  variant: ButtonVariant;
}) {
  const variantClass = variant === "primary" ? undefined : `qld__btn--${variant}`;

  return [
    "qld__btn",
    variantClass,
    leadingIcon ? "qld__btn--icon-lead" : undefined,
    trailingIcon ? "qld__btn--icon-trail" : undefined,
    "ssq-button",
    `ssq-button--${variant}`,
    leadingIcon ? "ssq-button--icon-lead" : undefined,
    trailingIcon ? "ssq-button--icon-trail" : undefined,
    disabled ? "ssq-button--disabled" : undefined,
    className
  ]
    .filter(Boolean)
    .join(" ");
}

function renderIcon(icon: ReactNode) {
  return (
    <span aria-hidden="true" className="qld__icon qld__icon--sm ssq-button__icon">
      {icon}
    </span>
  );
}

function renderContent(children: ReactNode, leadingIcon?: ReactNode, trailingIcon?: ReactNode) {
  return (
    <>
      {leadingIcon ? renderIcon(leadingIcon) : null}
      {children}
      {trailingIcon ? renderIcon(trailingIcon) : null}
    </>
  );
}

function preventDisabledClick(event: MouseEvent<HTMLAnchorElement | HTMLButtonElement>) {
  event.preventDefault();
  event.stopPropagation();
}

export function QhdsButton({
  children,
  className,
  disabled = false,
  leadingIcon,
  trailingIcon,
  variant = "primary",
  ...props
}: QhdsButtonProps) {
  const classes = getButtonClasses({ className, disabled, leadingIcon, trailingIcon, variant });
  const content = renderContent(children, leadingIcon, trailingIcon);

  if ("href" in props && typeof props.href === "string") {
    const { href, onClick, onNavigate, tabIndex, ...anchorProps } = props;
    const needsClickHandler = Boolean(onClick || onNavigate);
    const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
      if (disabled) {
        preventDisabledClick(event);
        return;
      }

      onClick?.(event);
      if (event.defaultPrevented) {
        return;
      }

      if (onNavigate) {
        event.preventDefault();
        onNavigate(href);
      }
    };

    return (
      <a
        {...anchorProps}
        aria-disabled={disabled || anchorProps["aria-disabled"] || undefined}
        className={classes}
        href={disabled ? undefined : href}
        onClick={needsClickHandler ? handleClick : undefined}
        tabIndex={disabled ? -1 : tabIndex}
      >
        {content}
      </a>
    );
  }

  if ("route" in props && typeof props.route === "string") {
    const { onClick, onNavigate, route, tabIndex, ...anchorProps } = props;
    const needsClickHandler = Boolean(onClick || onNavigate);
    const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
      if (disabled) {
        preventDisabledClick(event);
        return;
      }

      onClick?.(event);
      if (event.defaultPrevented) {
        return;
      }

      if (onNavigate) {
        event.preventDefault();
        onNavigate(route);
      }
    };

    return (
      <a
        {...anchorProps}
        aria-disabled={disabled || anchorProps["aria-disabled"] || undefined}
        className={classes}
        href={disabled ? undefined : route}
        onClick={needsClickHandler ? handleClick : undefined}
        tabIndex={disabled ? -1 : tabIndex}
      >
        {content}
      </a>
    );
  }

  const { onClick, type = "button", ...buttonProps } = props as Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    "children" | "className" | "disabled"
  >;
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (disabled) {
      preventDisabledClick(event);
      return;
    }

    onClick?.(event);
  };

  return (
    <button {...buttonProps} className={classes} disabled={disabled} onClick={onClick ? handleClick : undefined} type={type}>
      {content}
    </button>
  );
}
